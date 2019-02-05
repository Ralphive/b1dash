/* ByD Integration with Odata Services */
/* Server Configuration and User Credentials set in environment variables */

/** Environment Variables Required: 
 *  BYD_SERVER -> https://my123456.sapbydesign.com
 *  BYD_AUTH:  -> [Base64 Encoded] user:password> - Use https://www.base64encode.org/
 * 
 * Optional Environment variables which have default values:
 * BYD_PATH: -> Odata API path -> /sap/byd/odata/cust/v1 -> CP100110
 * BYD_SALESAPI -> Sales Order Service Path -> /khsalesorderdemo/SalesOrderCollection
 * BYD_DEFAULT_BP -> A Business Partner Code for the ByD Sales Order -> CP100110
 * BYD_ITEM -> Item code for the Sales Order ->  P100401
 * 
 * */ 



//Load Node Modules
var req = require('request') // HTTP Client

//Load Local configuration file
const BYD_SERVER = (process.env.BYD_SERVER  || 'https://<YOUR BYD TENANT>.sapbydesign.com') 
                 + (process.env.BYD_PATH    || '/sap/byd/odata/cust/v1')

const SALES_API = process.env.BYD_SALESAPI  || '/khsalesorderdemo/SalesOrderCollection'
const BYD_AUTH  = process.env.BYD_AUTH  || '<ENCODED 64   user:password>'



module.exports = {
    PostSalesOrder: function (callback) {
        return (PostSalesOrder(callback));
    }
}


let Connect = function () {

    /* There is no "login" endpoint in ByD. Instead the Base64 credentials should be passed in
     * the header of a GET Request. From the response of this request, we retrieve a CSRF token
     * that is required for any other method (POST/PATCH/DELETE etc...). Session Cookies are also 
     * required and in this app all of them are stored in global variables.
     **/

    return new Promise(function (resolve, reject) {


        var options  = {
            url: BYD_SERVER + SALES_API,
            method: "HEAD",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Basic " + BYD_AUTH,
                "x-csrf-token": "fetch",
                Cookie: "",
            }
        }
    
    
        req(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("BYD Reached successfully!")     
                    resolve(response);
            } else {
                console.error("Error reaching ByD. \n" + response.statusCode + " - " + error)
                reject(error, response);
            }
        });

    })

}


function byDPost(options, endpoint, callback) {
    options.uri = BYD_SERVER + endpoint
    console.log("Posting " + endpoint + " to " + options.uri)
    req.post(options, function (error, response, body) {
        if (!error && response.statusCode == 201) {
            body = JSON.parse(body);
            delete body["odata.metadata"];
            callback(null, response, body);
        } else {
            callback(response.statusMessage, response, null);
        }
    });
}


function PostSalesOrder(options, callback) {

    Connect(function (error, resp) {
        if (error) {
            console.error("Can't Connect to BYD Server");
            console.error(error);
        } else {
            console.log("Connected Successfully, lets create a Sales Order");
            var options = {
                headers: {
                    'Cookie': resp.cookie
                }
            };
            options.body = {
                url: getByDserver() + model_sales,
                method: "POST",
                headers: [],
                body: {
                    ExternalReference: "From Dash Button",
                    DataOriginTypeCode: "1",
                    Name: "Order created via SMB Mkt Place @" + moment.now(),
                    SalesOrderBuyerParty: {
                        PartyID: process.env.BYD_DEFAULT_BP || 'CP100110'
                    },
                    SalesOrderItem: [
                        {
                            ID: "10",
                            SalesOrderItemProduct: {
                                ProductID: process.env.BYD_ITEM || 'P100401'
                            },
                            SalesOrderItemScheduleLine: [
                                {
                                    Quantity: "1"
                                }
                            ]
                        }
                    ]
                }
        }
            //Make Request
            byDPost(options, SALES_API, function (error, response) {
                if (error) {
                    console.error("Error Creating Sales Order Message \n" + error );
                } else {
                    console.log("Sales Order created successfully!")
                }
            })
        }
    });
}