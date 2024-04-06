const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');




const app = express();
const port = 3000;



// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '8755446756',
    database: 'eclass'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
        return;
    }
    console.log('Connected to MySQL');
});


// Configure session middleware
app.use(session({
    secret: 'mnnitprayagraj', // Change this to a secret key for session encryption
    resave: false,
    saveUninitialized: true
}));

// Parse URL-encoded bodies (form data)
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Assuming your views are in a directory named 'views'


// Middleware to parse JSON data
app.use(bodyParser.json());

// Route to handle form submission
app.post('/studentsignupaction', (req, res) => {
    const { name, email, password, classs, rollno } = req.body;
    const sql = 'INSERT INTO `student` (`name`, `email`, `password`, `class`, `rollnumber`) VALUES (?, ?, ?, ?, ?)';
    console.log(req.body);

    connection.query(sql, [name, email, password, classs, rollno], (err, result) => {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).send('Error saving data!');
            return;
        }
        console.log('Data saved successfully!');
        const alertScript = '<script>alert("Data saved successfully!"); window.location.href = "/";</script>';
        res.send(alertScript);
    });
});


// Route to handle form submission
app.post('/teachersignupaction', (req, res) => {
    const { name, email, password, employeeid } = req.body;
    const sql = 'INSERT INTO `teacher` (`name`, `email`, `password`, `employeeid`) VALUES (?, ?, ?, ?)';
    console.log(req.body);

    connection.query(sql, [name, email, password, employeeid], (err, result) => {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).send('Error saving data!');
            return;
        }
        console.log('Data saved successfully!');
        const alertScript = '<script>alert("Data saved successfully!"); window.location.href = "/";</script>';
        res.send(alertScript);
    });
});




// Route to login form submission
app.post('/login', (req, res) => {
    const { username, password, role } = req.body;
    if (role === 'admin') {
        const sql = 'SELECT * FROM `admin` WHERE username = ?';
        connection.query(sql, [username], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error accessing database!');
                return;
            }
            if (results.length === 0) {
                // No admin found with the given username
                const alertScript = '<script>alert("Invalid username or password"); window.location.href = "/";</script>';

                res.status(401).send(alertScript);
            } else {
                const admin = results[0];
                if (password === admin.password) {
                    // Passwords match, start a session for the admin
                    req.session.loggedIn = true;
                    req.session.user = {
                        username: admin.username,
                        role: 'admin'
                    };
                    // Redirect to the dashboard
                    res.redirect('/dashboard');
                } else {
                    // Incorrect password
                    const alertScript = '<script>alert("Invalid username or password"); window.location.href = "/";</script>';

                    res.status(401).send(alertScript);
                }
            }
        });
    }
    else if (role === 'teacher') {
        const sql = 'SELECT * FROM `teacher` WHERE email = ?';
        connection.query(sql, [username], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error accessing database!');
                return;
            }
            if (results.length === 0) {
                // No teacher found with the given email
                const alertScript = '<script>alert("Invalid email or password"); window.location.href = "/";</script>';
    
                res.status(401).send(alertScript);
            } else {
                const teacher = results[0];
                if (password === teacher.password) {
                    // Passwords match, start a session for the teacher
                    req.session.loggedIn = true;
                    req.session.user = {
                        email: teacher.email,
                        role: 'teacher'
                    };
                    // Redirect to the dashboard
                    res.redirect('/teacherprofile');
                } else {
                    // Incorrect password
                    const alertScript = '<script>alert("Invalid email or password"); window.location.href = "/";</script>';
    
                    res.status(401).send(alertScript);
                }
            }
        });
    }
    
     else {
        // Non-admin roles not supported
        res.status(403).send('Forbidden');
    }
});

// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.get('/dashboard', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        const username = req.session.user.username;

        // Query the database to fetch admin details
        const sql = 'SELECT * FROM `admin` WHERE username = ?';
        connection.query(sql, [username], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error accessing database');
                return;
            }

            if (results.length === 0) {
                // Admin not found in the database
                res.status(404).send('Admin not found');
            } else {
                const admin = results[0];
                // Render the dashboard template with admin details
                res.render('dashboard', { admin });
            }
        });
    } else {
        // If not logged in or not an admin, redirect to the login page
        res.redirect('/');
    }
});

// Route to serve the teacher profile (accessible only if the user is logged in as a teacher)
app.get('/teacherprofile', (req, res) => {
    // Check if the user is logged in and has the 'teacher' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'teacher') {
        const email = req.session.user.email; // Assuming the email is stored in the session

        // Query the database to fetch teacher details
        const sql = 'SELECT * FROM `teacher` WHERE email = ?';
        connection.query(sql, [email], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error accessing database');
                return;
            }

            if (results.length === 0) {
                // Teacher not found in the database
                res.status(404).send('Teacher not found');
            } else {
                const teacher = results[0];
                // Render the teacher profile template with teacher details
                res.render('teacherprofile', { teacher });
            }
        });
    } else {
        // If not logged in or not a teacher, redirect to the login page
        res.redirect('/');
    }
});


// Route to handle logout and destroy session
app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session: ', err);
            res.status(500).send('Error logging out');
        } else {
            // Redirect to the login page after successful logout
            res.redirect('/');
        }
    });
});


// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.get('/dashboardteachers', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        const username = req.session.user.username;

        // Query the database to fetch admin details
        const sql = 'SELECT * FROM `admin` WHERE username = ?';
        connection.query(sql, [username], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error accessing database');
                return;
            }

            if (results.length === 0) {
                // Admin not found in the database
                res.status(404).send('Admin not found');
            } else {
                const admin = results[0];
                // Render the dashboardteachers template with admin details
                res.render('dashboardteachers', { admin });
            }
        });
    } else {
        // If not logged in or not an admin, redirect to the login page
        res.redirect('/');
    }
});

// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.get('/studentlist', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        // Query the database to fetch student details
        const sql = 'SELECT * FROM `student`';
        connection.query(sql, (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).json({ error: 'Error accessing database' });
                return;
            }

            // If no error, send the student details as JSON response
            res.status(200).json(results);
        });
    } else {
        // If not logged in or not an admin, send unauthorized status
        res.status(401).json({ error: 'Unauthorized' });
    }
});


// Route to update student data
app.post('/updatestudent', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        const { name, email, password, classs, rollno, subject, idstudent } = req.body;
       
        const sql = 'UPDATE `student` SET `name` = ?, `email` = ?, `password` = ?, `class` = ?, `rollnumber` = ?, `subject` = ? WHERE `idstudent` = ?';
    
        connection.query(sql, [name, email, password, classs, rollno, subject, idstudent], (err, result) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('<script>alert("Error updating data!"); window.location.href = "/dashboard";</script>');
                return;
            }
            console.log('Data updated successfully!');
            const alertScript = '<script>alert("Data updated successfully!"); window.location.href = "/dashboard";</script>';
            res.send(alertScript);
        });
    } else {
        // If not logged in or not an admin, send unauthorized status
        res.status(401).json({ error: 'Unauthorized' });
    }
});




// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.post('/getStudentDetails', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        const studentId = req.body.studentId; // Extract student ID from the request body

        // Query the database to fetch student details based on the provided student ID
        const sql = 'SELECT * FROM `student` WHERE idstudent = ?';
        connection.query(sql, [studentId], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).json({ error: 'Error accessing database' });
                return;
            }

            if (results.length === 0) {
                // If no student found with the provided ID, send not found status
                res.status(404).json({ error: 'Student not found' });
            } else {
                // If student details found, send the student details as JSON response
                res.status(200).json(results[0]);
            }
        });
    } else {
        // If not logged in or not an admin, send unauthorized status
        res.status(401).json({ error: 'Unauthorized' });
    }
});


// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.post('/verifyStudent', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        // Extract student ID from the request body
        const studentId = req.body.studentId;

        // Query to update the verification status of the student
        const sql = 'UPDATE `student` SET verify = ? WHERE idstudent = ?';
        connection.query(sql, [1, studentId], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error updating verification status');
                return;
            }

            // Send a success response
            res.status(200).send('Student verification status updated successfully');
        });
    } else {
        // If not logged in or not an admin, send an unauthorized status
        res.status(401).send('Unauthorized');
    }
});

// Route to delete a student (accessible only if the user is logged in as an admin)
app.post('/deleteStudent', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        // Extract student ID from the request body
        const studentId = req.body.studentId;

        // Query to delete the student
        const sql = 'DELETE FROM `student` WHERE idstudent = ?';
        connection.query(sql, [studentId], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error deleting student');
                return;
            }

            // Send a success response
            res.status(200).send('Student deleted successfully');
        });
    } else {
        // If not logged in or not an admin, send an unauthorized status
        res.status(401).send('Unauthorized');
    }
});


// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.post('/blockStudent', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        // Extract student ID from the request body
        const studentId = req.body.studentId;

        // Query to update the verification status of the student
        const sql = 'UPDATE `student` SET verify = ? WHERE idstudent = ?';
        connection.query(sql, [0, studentId], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error updating verification status');
                return;
            }

            // Send a success response
            res.status(200).send('Student verification status updated successfully');
        });
    } else {
        // If not logged in or not an admin, send an unauthorized status
        res.status(401).send('Unauthorized');
    }
});


// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.get('/teacherlist', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        // Query the database to fetch teacher details
        const sql = 'SELECT * FROM `teacher`';
        connection.query(sql, (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).json({ error: 'Error accessing database' });
                return;
            }

            // If no error, send the teacher details as JSON response
            res.status(200).json(results);
        });
    } else {
        // If not logged in or not an admin, send unauthorized status
        res.status(401).json({ error: 'Unauthorized' });
    }
});


// Route to update teacher data
app.post('/updateteacher', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        const { name, email, password, employeeid, idteacher } = req.body;
       
        const sql = 'UPDATE `teacher` SET `name` = ?, `email` = ?, `password` = ?, `employeeid` = ? WHERE `idteacher` = ?';
    
        connection.query(sql, [name, email, password, employeeid, idteacher], (err, result) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('<script>alert("Error updating data!"); window.location.href = "/dashboardteachers";</script>');
                return;
            }
            console.log('Data updated successfully!');
            const alertScript = '<script>alert("Data updated successfully!"); window.location.href = "/dashboardteachers";</script>';
            res.send(alertScript);
        });
    } else {
        // If not logged in or not an admin, send unauthorized status
        res.status(401).json({ error: 'Unauthorized' });
    }
});




// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.post('/getteacherDetails', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        const teacherId = req.body.teacherId; // Extract teacher ID from the request body

        // Query the database to fetch teacher details based on the provided teacher ID
        const sql = 'SELECT * FROM `teacher` WHERE idteacher = ?';
        connection.query(sql, [teacherId], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).json({ error: 'Error accessing database' });
                return;
            }

            if (results.length === 0) {
                // If no teacher found with the provided ID, send not found status
                res.status(404).json({ error: 'teacher not found' });
            } else {
                // If teacher details found, send the teacher details as JSON response
                res.status(200).json(results[0]);
            }
        });
    } else {
        // If not logged in or not an admin, send unauthorized status
        res.status(401).json({ error: 'Unauthorized' });
    }
});


// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.post('/verifyteacher', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        // Extract teacher ID from the request body
        const teacherId = req.body.teacherId;

        // Query to update the verification status of the teacher
        const sql = 'UPDATE `teacher` SET verify = ? WHERE idteacher = ?';
        connection.query(sql, [1, teacherId], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error updating verification status');
                return;
            }

            // Send a success response
            res.status(200).send('teacher verification status updated successfully');
        });
    } else {
        // If not logged in or not an admin, send an unauthorized status
        res.status(401).send('Unauthorized');
    }
});

// Route to delete a teacher (accessible only if the user is logged in as an admin)
app.post('/deleteteacher', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        // Extract teacher ID from the request body
        const teacherId = req.body.teacherId;

        // Query to delete the teacher
        const sql = 'DELETE FROM `teacher` WHERE idteacher = ?';
        connection.query(sql, [teacherId], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error deleting teacher');
                return;
            }

            // Send a success response
            res.status(200).send('teacher deleted successfully');
        });
    } else {
        // If not logged in or not an admin, send an unauthorized status
        res.status(401).send('Unauthorized');
    }
});


// Route to serve the dashboard (accessible only if the user is logged in as an admin)
app.post('/blockteacher', (req, res) => {
    // Check if the user is logged in and has the 'admin' role
    if (req.session.loggedIn && req.session.user && req.session.user.role === 'admin') {
        // Extract teacher ID from the request body
        const teacherId = req.body.teacherId;

        // Query to update the verification status of the teacher
        const sql = 'UPDATE `teacher` SET verify = ? WHERE idteacher = ?';
        connection.query(sql, [0, teacherId], (err, results) => {
            if (err) {
                console.error('Error executing query: ', err);
                res.status(500).send('Error updating verification status');
                return;
            }

            // Send a success response
            res.status(200).send('teacher verification status updated successfully');
        });
    } else {
        // If not logged in or not an admin, send an unauthorized status
        res.status(401).send('Unauthorized');
    }
});





app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/signupstudent', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/signupstudent.html'));
});

app.get('/signupteacher', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/signupteacher.html'));
});

app.get('/about', (req, res) => {
  res.send('about');
});

module.exports = app; // Export the app object
