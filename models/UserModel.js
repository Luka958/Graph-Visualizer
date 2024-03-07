const { query } = require('../db');

class User {
    constructor(id, username, email, firstName, lastName, dateOfBirth, country, company, password, role) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.country = country;
        this.company = company;
        this.password = password;
        this.role = role;
    }

    async updateUser(username, firstName, lastName, dateOfBirth, country, company, password) {
        let result;
        try {
            result = await query(
                `UPDATE "user"
                 SET username = ?, first_name = ?, last_name = ?, date_of_birth = ?, country = ?, company = ?, password = ?
                 WHERE email = ?`,
                [username, firstName, lastName, dateOfBirth, country, company, password, this.email]);
        } catch (err) { console.log(err); }
        return result;
    }
}

async function getById(id) {
    let result;
    try {
        result = await query(`SELECT * FROM "user" WHERE id = ?`, [id]);
    } catch (err) { console.log(err); }
    return result.rows;
}

async function getByEmail(email) {
    let result;
    try {
        result = await query(`SELECT * FROM "user" WHERE email = ?`, [email]);
    } catch (err) { console.log(err); }
    return result.rows;
}

async function getByUsername(username) {
    let result;
    try {
        result = await query(`SELECT * FROM "user" WHERE username = ?`, [username]);
    } catch (err) { console.log(err); }
    return result.rows;
}

async function insertUser(username, email, firstName, lastName, dateOfBirth, country, company, password, role) {
    try {
        await query(`INSERT INTO "user" (username, email, first_name, last_name, date_of_birth, country, company, password, role) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, email, firstName, lastName, dateOfBirth, country, company, password, role]);
    } catch (err) { console.log(err); }
}

async function getUsers() {
    let result;
    try {
        result = await query(`SELECT * FROM "user" WHERE role <> ? ORDER BY id`, ['admin']);
    } catch (err) { console.log(err); }
    return result.rows;
}

async function updateUsersRole(ids, roles) {
    // Process each user role update individually
    for (let i = 0; i < ids.length; i++) {
        try {
            await query(`UPDATE "user" SET role = ? WHERE id = ?`, [roles[i], ids[i]]);
        } catch (err) { console.log(err); }
    }
}

async function insertProperties(id, props) {
    try {
        await query(`INSERT INTO properties (id, vertex, edge, canvas) VALUES (?, ?, ?, ?)`,
            [id, JSON.stringify(props.vertex), JSON.stringify(props.edge), JSON.stringify(props.canvas)]);
    } catch (err) { console.log(err); }
}

async function getProperties(id) {
    let result;
    try {
        result = await query(`SELECT * FROM properties WHERE id = ?`, [id]);
        return result.rows.map(row => ({
            id: row.id,
            vertex: JSON.parse(row.vertex),
            edge: JSON.parse(row.edge),
            canvas: JSON.parse(row.canvas)
        }));
    } catch (err) {
        console.log(err);
        return [];
    }
}


async function updateProperties(id, props) {
    try {
        await query(`UPDATE properties SET vertex = ?, edge = ?, canvas = ? WHERE id = ?`,
            [JSON.stringify(props.vertex), JSON.stringify(props.edge), JSON.stringify(props.canvas), id]);
    } catch (err) { console.log(err); }
}

module.exports = {
    User, getById, getByEmail, getByUsername, getUsers,
    updateUsersRole, insertUser, insertProperties, getProperties, updateProperties
};
