require("dotenv").config();
const mysql = require("mysql");
const cTable = require("console.table");
const inquirer = require("inquirer");
// console.log(process.env);

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "bamazon",
});

connection.connect((err) => {
    if (err) throw (err);

    // console.log("connected as ID " + connection.threadId);
    console.log("");
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~`~~~~~~~~~~~~~~~~~~~~~~~`~~~~~~~~~~~~~~~~~~~~~~~~~");
    console.log("~~~~~~~~~~~~~~~`~~~~~~~~~~~~~ WELCOME TO BAMAZON ~~~~~~~~~~~`~~~~~~~~~~~~~~~~");
    console.log("~~~~`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`~~~~~");
    console.log("");
    console.log("ITEMS FOR SALE:");
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    connection.query("SELECT * FROM products", (err, res) => {
        if (err) throw (err);
        console.log(console.table(res));
        managerStart();
    })
});

// main logic, options for manager
function managerStart() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'option',
            message: 'Please select an option:',
            choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product'],
            filter: function (val) {
                if (val === 'View Products for Sale') {
                    return 'sale';
                } else if (val === 'View Low Inventory') {
                    return 'lowInventory';
                } else if (val === 'Add to Inventory') {
                    return 'addInventory';
                } else if (val === 'Add New Product') {
                    return 'newProduct';
                } else {
                    console.log('ERROR: Unsupported operation!');
                    exit(1);
                }
            }
        }
    ]).then(function (input) {
        if (input.option === 'sale') {
            displayInventory();
        } else if (input.option === 'lowInventory') {
            displayLowInventory();
        } else if (input.option === 'addInventory') {
            addInventory();
        } else if (input.option === 'newProduct') {
            createNewProduct();
        } else {
            console.log('ERROR: Unsupported operation!');
            exit(1);
        }
    })
}

// displayInventory will retrieve the current inventory from the database and output it to the console
function displayInventory() {
    queryStr = 'SELECT * FROM products';

    connection.query(queryStr, function (err, data) {
        if (err) throw err;

        console.log("EXISTING INVENTORY:");
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        console.table(data);
        console.log("---------------------------------------------------------------------\n");

        managerStart();
    })
}

// displayLowInventory will display a list of products with the available quantity below 100
function displayLowInventory() {
    queryStr = 'SELECT * FROM products WHERE stock_quantity < 10';

    connection.query(queryStr, function (err, data) {
        if (err) throw err;

        console.log("ITEMS BELOW 10 COUNT:");
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        console.table(data);
        console.log("---------------------------------------------------------------------\n");

        managerStart();
    })
}

// makes sure that the user is supplying only positive integers for their inputs
function validateInteger(value) {
    var integer = Number.isInteger(parseFloat(value));
    var sign = Math.sign(value);

    if (integer && (sign === 1)) {
        return true;
    } else {
        return 'Please enter a whole non-zero number.';
    }
}

// makes sure that the user is supplying only positive numbers for their inputs
function validateNumeric(value) {
    var number = (typeof parseFloat(value)) === 'number';
    var positive = parseFloat(value) > 0;

    if (number && positive) {
        return true;
    } else {
        return 'Please enter a positive number for the unit price.'
    }
}

// add additional quantity to an existing item
function addInventory() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'item_id',
            message: 'Please enter the Item ID for stock_count update:',
            validate: validateInteger,
            filter: Number
        },
        {
            type: 'input',
            name: 'quantity',
            message: 'How many would you like to add?',
            validate: validateInteger,
            filter: Number
        }
    ]).then(function (input) {

        var item = input.item_id;
        var addQuantity = input.quantity;
        var queryStr = 'SELECT * FROM products WHERE ?';

        connection.query(queryStr, { item_id: item }, function (err, data) {
            if (err) throw err;

            if (data.length === 0) {
                console.log('ERROR: Invalid Item ID. Please select a valid Item ID.');
                addInventory();

            } else {
                var productData = data[0];

                console.log('Updating Inventory...');

                var updateQueryStr = 'UPDATE products SET stock_quantity = ' + (productData.stock_quantity + addQuantity) + ' WHERE item_id = ' + item;

                connection.query(updateQueryStr, function (err, data) {
                    if (err) throw err;

                    console.log('Stock count for Item ID ' + item + ' has been updated to ' + (productData.stock_quantity + addQuantity) + '.');
                    console.log("\n---------------------------------------------------------------------\n");

                    managerStart();
                })
            }
        })
    })
}

// add a new product to the inventory
function createNewProduct() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'product_name',
            message: 'Please enter the new product name:',
        },
        {
            type: 'input',
            name: 'department_name',
            message: 'Which department does the new product belong to?',
        },
        {
            type: 'input',
            name: 'price',
            message: 'What is the price per unit?',
            validate: validateNumeric
        },
        {
            type: 'input',
            name: 'stock_quantity',
            message: 'How many items are in stock?',
            validate: validateInteger
        }
    ]).then(function (input) {

        console.log('Adding New Item: \n    product_name = ' + input.product_name + '\n' +
            '    department_name = ' + input.department_name + '\n' +
            '    price = ' + input.price + '\n' +
            '    stock_quantity = ' + input.stock_quantity);

        var queryStr = 'INSERT INTO products SET ?';

        connection.query(queryStr, input, function (error, results, fields) {
            if (error) throw error;

            console.log('New product has been added to the inventory under Item ID ' + results.insertId + '.');
            console.log("\n---------------------------------------------------------------------\n");

            managerStart();
        });
    })
}