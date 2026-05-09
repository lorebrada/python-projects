"""
reduce_emdashes.py — surgically reduce em-dash count in the manuscript.

Strategy:
  - Preserve em dashes in code blocks (between ``` fences).
  - Preserve em dashes in headings (# / ## / ### lines).
  - Preserve em dashes in patterns that are stylistically correct:
    * "Failure mode N — ..." (labeled list items)
    * "Key takeaways — Ch. N." (callout markers)
    * "Edition VIII —" / "Edition IX —"
    * "end <X>" signoffs at end-of-section
    * "[X-Y]" tag patterns (these are en-dash anyway, but check)
  - For the remaining inline prose em dashes, apply heuristic rewrites:
    * Parenthetical aside `X — Y — Z` → `X (Y) Z`
    * End-of-sentence clause `X — Y.` → `X: Y.` or `X. Y.`
    * Mid-sentence comma replacement `X, Y — Z, W` → `X, Y, Z, W`
    * Otherwise → `; ` (semicolon)

Goal: ~50% reduction (from 325 to ~150), preserving stylistic em dashes
and meaning everywhere.
"""
from __future__ import annotations
import re
import sys


def reduce(text: str) -> tuple[str, int, int]:
    """Return (reduced text, original em-dash count, new em-dash count)."""
    orig_count = text.count("—")
    out: list[str] = []
    in_code = False
    lines = text.splitlines(keepends=True)
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            out.append(line)
            continue
        if in_code:
            out.append(line)
            continue
        if stripped.startswith("#"):
            out.append(line)
            continue
        # Skip table rows (em dashes in tables are alignment markers and content separators).
        if stripped.startswith("|") and "—" not in stripped:
            out.append(line)
            continue
        out.append(rewrite_prose_line(line))
    new_text = "".join(out)
    new_count = new_text.count("—")
    return new_text, orig_count, new_count


# Patterns where em dash is stylistically correct and should be preserved.
PRESERVE_PATTERNS = [
    # Section signoffs: "— end ..." or "— END ..."
    re.compile(r"— *(end|END) "),
    # Edition labels at start of clause: "Edition VIII —" or "Edition IX —"
    re.compile(r"\bEdition (VIII|IX|X) —"),
    # "Ch. NN —" chapter-title leaders
    re.compile(r"\bCh\. \d+ —"),
    # "Key takeaways —" callouts
    re.compile(r"\bKey takeaways —"),
    # "Failure mode N —" list-item leaders
    re.compile(r"\bFailure mode \d+ —"),
    # "Operational rule —" type imperative leaders
    re.compile(r"\bOperational rule —"),
    # "Hedge —" callout leader
    re.compile(r"\bHedge —"),
    # "Production reality —" / similar
    re.compile(r"\bProduction (reality|pitfall) —"),
    # NCCL bus-bandwidth label, FA-3, etc.
    re.compile(r"^— "),
    # Reference tags like [LMSYS-EP-2025] are unaffected (no em dash).
    # Keep "FA-3 — ..." leader patterns (with bold)
    re.compile(r"^\*\*FA-\d.*?—"),
]


def is_preserved_segment(line: str, pos: int) -> bool:
    """Check if the em dash at position `pos` is in a preserved pattern context."""
    for pat in PRESERVE_PATTERNS:
        for m in pat.finditer(line):
            if m.start() <= pos <= m.end():
                return True
    # Preserve if at very start of line (used as bullet/leader)
    if pos < 5 and line[:pos].strip() in ("", ">", "*", "-"):
        return True
    return False


def rewrite_prose_line(line: str) -> str:
    """Apply heuristic em-dash reductions to a prose line."""
    # Quick out
    if "—" not in line:
        return line

    # Pre-protect preserved patterns by sentinel substitution.
    SENTINEL = "\x00\x00\x00"
    protected = line
    spans: list[tuple[int, int]] = []
    for pat in PRESERVE_PATTERNS:
        for m in pat.finditer(line):
            spans.append(m.span())
    spans.sort()
    # Build a list of preserved indices
    preserved_idxs: set[int] = set()
    for start, end in spans:
        for j in range(start, end):
            preserved_idxs.add(j)

    # Walk the line; for each em dash that is NOT in a preserved span, decide rewrite.
    result_chars: list[str] = []
    i = 0
    line_len = len(line)
    # Track number of em dashes already rewritten in this line
    rewrite_count_in_line = 0

    # Find all em-dash positions.
    em_positions = [j for j, ch in enumerate(line) if ch == "—" and j not in preserved_idxs]

    # Heuristic: if there are 2 em dashes on the line in close proximity (<= 80 chars apart),
    # treat them as a parenthetical pair → replace with ( and ).
    # Otherwise, single em dashes get replaced with semicolons or colons by context.

    # Detect pairs first
    used_paired: set[int] = set()
    for k in range(len(em_positions) - 1):
        p1, p2 = em_positions[k], em_positions[k + 1]
        if p2 - p1 <= 100 and p1 not in used_paired and p2 not in used_paired:
            # Check there is no sentence boundary between them
            mid = line[p1:p2]
            if "." not in mid and "!" not in mid and "?" not in mid:
                used_paired.add(p1)
                used_paired.add(p2)

    # Build output
    for j, ch in enumerate(line):
        if ch == "—" and j in preserved_idxs:
            result_chars.append(ch)
            continue
        if ch == "—" and j not in preserved_idxs:
            if j in used_paired:
                # Determine if this is the opening or closing of the pair.
                pair_partners = sorted(used_paired)
                idx_of_self = pair_partners.index(j)
                # Find pair index
                if idx_of_self % 2 == 0:
                    # Opening
                    # Remove preceding space and following space; insert "("
                    # Find preceding char
                    if result_chars and result_chars[-1] == " ":
                        result_chars.pop()
                    result_chars.append(" (")
                    # Skip the trailing space if present
                    # We handle trailing space outside; since we are streaming, we will replace " — " with " (" and rely on reverse for closing.
                else:
                    # Closing
                    if result_chars and result_chars[-1] == " ":
                        result_chars.pop()
                    result_chars.append(") ")
                # Skip the next char if it is space (we already added space inside the bracket form).
                continue
            # Single em dash: choose replacement by context.
            # Look at preceding 25 chars and following 25 chars.
            before = line[max(0, j - 30):j]
            after = line[j + 1:min(line_len, j + 30)]
            # If "i.e.," or "e.g.," follows, use comma.
            if re.search(r"^\s*(i\.e\.|e\.g\.)", after):
                replacement = ","
            # If after starts with "the" or short noun phrase that continues a sentence: use colon/semicolon.
            elif re.search(r"^\s*[a-z]", after) and "." not in line[j:j+50]:
                replacement = ";"
            elif re.search(r"^\s*[A-Z]", after):
                replacement = "."
                # But avoid converting if before doesn't end naturally; use semicolon then.
                if before.rstrip().endswith((",", ";", ":")):
                    replacement = ";"
            else:
                replacement = ","
            # Strip surrounding spaces appropriately.
            # Pattern in source is " — "; we want to produce ", " or "; " or ": " or ". " etc.
            # We need to remove the preceding space.
            if result_chars and result_chars[-1] == " ":
                result_chars.pop()
            result_chars.append(replacement)
            # Following character handling: keep the space (the space after em dash is in source)
            continue
        result_chars.append(ch)

    return "".join(result_chars)


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: python reduce_emdashes.py <file>")
        return 2
    path = sys.argv[1]
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    new_text, orig, new = reduce(text)
    if "--write" in sys.argv:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_text)
    print(f"em dashes: {orig} -> {new} (reduction {orig - new}, {(orig - new) * 100 // orig}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
