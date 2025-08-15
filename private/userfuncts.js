// Back end authentication functions

export function logoutUser() {
    sessionStorage.removeItem("user_id");   // Clear the session storage
    window.location.href = "/login.html";    // Redirect back to log in
}

export async function loginUser(username, password) {
    // Call users api LoginUser and send username and password to database
    const response = await fetch(`/api/users/LoginUser`, {
      method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.message === "Login successful") {
          alert('Login successful! Redirecting...');
          sessionStorage.setItem('user_id', data.userId);
          window.location.href = '/index.html';
        } else {
          alert('Login failed: ' + data.message);
        }
      } else {
        alert('Error logging in. Please try again.');
      }
};

export async function RegisterUser(name, username, password, confirmPassword) {
  if (password !== confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }
    // Get employee ID from existing employee before registering a user
    const employeeRes = await fetch(`api/employees/GetEmployees?employee_name=${encodeURIComponent(name)}`);
    const employeeData = await employeeRes.json();
    const employee_id = employeeData[0]?._id || null;
    // If user isn't a current employee don't add them to the database
    if(employee_id === null){
      alert('User is not a current employee. System administrator must add employee before registering.');
      return;
    }
    const user_check = await fetch(`/api/users/GetUsers?username=${username}&employee_id=${employee_id}`);
    const data = await user_check.json();
    console.log(data); // See if this is ever null
    // If user is already in database or the employee is linked to a different account don't add them to the database
    if (data.length !== 0){
      alert('User already exists in database or employee linked to another account.');
      return;
    }
    const response = await fetch(`/api/users/RegisterUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, employee_id })
    });
    if (response.ok) {
      alert('Registration successful! You can now log in.');
      window.location.href = '/login.html';
    } else {
      alert('Registration failed: ' + response.message);
    }
}