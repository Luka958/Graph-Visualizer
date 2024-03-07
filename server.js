const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session); // Import connect-sqlite3 for session storage
const _ = require('lodash');
const port = 3000;

const homeRouter = require('./routes/home.routes');
const loginRouter = require('./routes/login.routes');
const logoutRouter = require('./routes/logout.routes');
const signupRouter = require('./routes/signup.routes');
const vertexRouter = require('./routes/vertex.routes');
const edgeRouter = require('./routes/edge.routes');
const algorithmRouter = require('./routes/algorithm.routes');
const canvasRouter = require('./routes/canvas.routes');
const importRouter = require('./routes/import.routes');
const accountRouter = require('./routes/account.routes');
const adminPortalRouter = require('./routes/admin_portal.routes');

//middleware - (ejs)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//middleware - static resources
app.use(express.static(path.join(__dirname, 'public')));

//middleware - parameter decoding
app.use(express.urlencoded({ extended: true }));

// parsing application/json
app.use(express.json());

// Save session to SQLite database using connect-sqlite3
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db', // Name of the SQLite database file for storing sessions
        dir: '.' // Directory where the sessions.db file will be stored, make sure this directory exists and is writable
    }),
    secret: 'secret',
    saveUninitialized: true,
    resave: false,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

app.use('/', homeRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/signup', signupRouter);
app.use('/vertex', vertexRouter);
app.use('/edge', edgeRouter);
app.use('/algorithm', algorithmRouter);
app.use('/canvas', canvasRouter);
app.use('/import', importRouter);
app.use('/account', accountRouter);
app.use('/admin_portal', adminPortalRouter);

// set lodash as global variable (make it available in ejs)
app.locals._ = _;

app.listen(port);