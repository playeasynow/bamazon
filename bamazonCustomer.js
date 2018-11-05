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
        
        console.table(res);
        purchaseItem();
    })
});


function purchaseItem() {
    inquirer.prompt([{
        name: "item_id",
        type: "input",
        message: "What is the ID of the item you would like to buy?",
        validate: function (value) {
            if (isNaN(value) == false) {
                return true;
            } else {
                return false;
            }
        }
    }, {
        name: "quantity",
        type: "input",
        message: "How many units of this item would you like to buy?",
        validate: function (value) {
            if (isNaN(value) == false) {
                return true;
            } else {
                return false;
            }
        }
    }]).then(function (answers) {
        // console.log(answer);
        const query = "SELECT * FROM products WHERE ?";
        connection.query(query, { item_id: answers.item_id }, function (err, res) {
            if (err) throw err;
            const id = res[0].item_id;
            const newQuant = res[0].stock_quantity - answers.quantity,
             orderPrice = res[0].price * answers.quantity;
            // const totalSales = res[0].product_sales + orderPrice;
            if (res[0].stock_quantity < answers.quantity) {
                console.log("Insufficient quantity!");
                connection.end();
            } else {
                connection.query('UPDATE products SET ? WHERE item_id = ?', [{ stock_quantity: newQuant }, id],
                    function (err, res) {
                        console.log("Order successful! Total cost: $" + orderPrice);
                        inquirer.prompt([{
                            name: "confirm",
                            type: "confirm",
                            message: "Make another purchase?"
                        }]).then(function (answers) {
                            if (answers.confirm === true) {
                                purchaseItem();
                            } else {
                                connection.end();
                            }
                        })

                    });
            }
        });

    })
}