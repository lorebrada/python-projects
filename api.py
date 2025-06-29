import json
from flask import Flask, request, jsonify
app = Flask(__name__)

def employee_is_valid(employee):
    """Check if the employee data contains required fields."""
    required_fields = ['name', 'position', 'department']
    return all(field in employee and employee[field] for field in required_fields)

employees = [ {'id': 1, 'name': "Lorenzo", 'age': 25, 'department': "Communications"},
             {'id': 2 , 'name': "Giovanni", 'age': 30, 'department': "Marketing"},
             {'id': 3, 'name': "Francesca", 'age': 28, 'department': "Accounting"},
             {'id': 4, 'name': "Alessandro", 'age': 35, 'department': "IT"},
             {'id': 5, 'name': "Luca", 'age': 29, 'department': "HR"}]

nextEmployeeID = len(employees) + 1 

@app.route('/employees', methods=['GET'])
def get_employees():
    """Get the list of employees."""
    return jsonify(employees)

@app.route('/employees', methods=['POST'])
def add_employee():
    """Add a new employee."""
    global nextEmployeeID
    employee = json.loads(request.data)
    if not employee_is_valid(employee):
        return jsonify({"error": "Invalid employee data"}), 400
    
    employee['id'] = len(employees) + 1
    employees.append(employee)

    return '', jsonify({"message": "Employee added successfully", "employee": employee}), 201

def get_employee(employee_id):
    """Retrieve an employee by ID."""
    return next((emp for emp in employees if emp['id'] == employee_id), None)

@app.route('/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id: int):
    """Update an existing employee."""
    employee = get_employee(employee_id)
    if employee is None:
        return jsonify({'error': 'employee not found'}), 404
    updated_data = json.loads(request.data)
    if not employee_is_valid(updated_data):
        return jsonify({'error': 'Invalid employee data'}), 400
    employee.update(updated_data)

    return jsonify({'message': 'Employee updated successfully', 'employee': employee})

@app.route('/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id: int):
    """Delete an employee."""
    global employees
    employee = get_employee(id)
    if employee is None:
        return jsonify({'error': 'employee not found'}), 404
    
    employees = [emp for emp in employees if emp['id'] != employee_id]

    return jsonify({'message': 'Employee deleted successfully'}), 200

if __name__ == '__main__':
    app.run(port=5050, debug=True)