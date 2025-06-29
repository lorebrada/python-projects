import pygame
pygame.init()
import random 
import math 

# Define the spaceship class
class spaceship:
    def __init__(self, position):
        self.position = position

class Bullet:
    def __init__(self, position):
        self.position = position


class SpaceRocks: 
    MIN_ASTEROID_DISTANCE = 100
    show_debug = False
    def __init__(self):
        self.__init__pygame()
        self.screen = pygame.display.set_mode((800, 600))
        pygame.display.set_caption("Space Rocks")
        self.clock = pygame.time.Clock()
        self.running = True
        self.asteroids = []
        self.ship = spaceship((400, 300))
        self.bullets = []
        self.score = 0
        self.font = pygame.font.Font(None, 36)

    def __init__pygame(self):
        pygame.init()
        pygame.font.init()
        pygame.mixer.init()
        pygame.display.set_caption("Space Rocks")
        self.screen = pygame.display.set_mode((800, 600))
        
    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(60) #Limits to 60 FPS
            pygame.display.flip()
        pygame.quit()


    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                if event.key == pygame.K_EXCAPE:
                    self.running = False
                elif event.key == pygame.K_SPACE:
                    self.fire_bullet()

    def fire_bullets(self):
        if len(self.bullets) < 5:
            bullet = Bullet(self.ship.position)
            self.bullets.append(bullet)


    def update(self):
        self.update_asteroids()
        self.update_bullets()
        self.check_collisions()

    
    def update_asteroids(self):
        if len(self.asteroids) < 5:
            position = self.get_random_position()
            if not self.is_position_valid(position):
                return
            asteroid = pygame.Rect(position[0], position[1], 50, 50)
            self.asteroids.append(asteroid)


    def update_bullets(self):
        for bullet in self.bullets:
            bullet.position[1] -= 5
            if bullet.position[1] < 0:
                self.bullets.remove(bullet)

    
    def check_collisions(self):
        for asteroid in self.asteroids:
            for bullet in self.bullets:
                if asteroid.colliderect(pygame.Rect(bullet.position[0], bullet.position[1], 5, 5)):
                    self.asteroids.remove(asteroid)
                    self.bullets.remove(bullet)
                    self.score += 1

    
    def get_random_position(self):
        x = random.randint(0, 800)
        y = random.randint(0, 600)
        return (x, y)
    
    def is_position_valid(self, position):
        for asteroid in self.asteroids:
            if math.hypot(asteroid.x - position[0], asteroid.y - position[1]) < self.MIN_ASTEROID_DISTANCE:
                return False
        return True
    
    def draw(self):
        self.screen.fill((0, 0, 0))
        for asteroid in self.asteroids:
            pygame.draw.rect(self.screen, (255, 0, 0), asteroid)
            for bullet in self.bullets:
                pygame.draw.rect(self.screen, (0, 255, 0), pygame.Rect(bullet.position[0], bullet.position[1], 5, 5))
                pygame.draw.circle(self.screen, (255, 255, 0), (int(self.ship.position[0]), int(self.spaceship.position[1])), 20)
                score_text = self.font.render(f"Score: {self.score}", True, (255, 255, 255))
                self.screen.blit(score_text, (10, 10))
                if self.show_debug:
                    debug_text = self.font.render(f"Asteroids: {len(self.asteroids)}", True, (255, 255, 255))
                    self.screen.blit(debug_text, (10, 10))
                    pygame.display.flip()


        if __name__ == "__main__":
            game = SpaceRocks()
            game.run()

# This code initializes a simple game using Pygame where the player can shoot bullets at asteroids. 
