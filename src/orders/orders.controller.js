const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function list (req, res) {          // handle GET request for /orders
    res.json({data: orders})
}

function create( req, res ) {       // handle POST request to create new order at /orders
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes,
    }
    orders.push(newOrder)
    res.status(201).json( {data: newOrder} )
}

function read (req, res) {          // handle GET request for /orders/:orderId
    res.json({data: res.locals.order})
}


function update (req, res, next) {      // handle PUT request to add new order at /orders/:orderId
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    res.json( {data: order} );
}

function destroy(req, res) {     // handle DELETE request to delete order at /orders/orderId
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    const deletedPastes = orders.splice(index, 1);
    res.sendStatus(204);
}

function orderExists (req, res, next) {     // check if there is an order that matches the 'orderId' param associated with a request
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;      // store order in res.locals
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}`,
      });
}

function idMatchesOrder(req, res, next){    // check if id of order associated with request matches the order in the url
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id && id !== orderId){
      return next({
              status: 400,
              message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
          });
       }
     next()
  }

function dishesIsValid(req, res, next) {    // check if order has a valid 'dishes' property
    const { data: { dishes} } = req.body;
    if (dishes.length >= 1 && Array.isArray(req.body.data.dishes)) {    // must be an array, must not be empty, already checking that it exists in another function, 'bodyHasProperty("dishes")'
        return next();
    } else {
    return next({
        status: 400,
        message: `Order must include at least one dish.`
    });
}
}

function quantityIsValid (req, res, next) {     // check if quantity property of 'dish' property of order is valid
    const { data: { dishes } = {} } = req.body;
    let invalid = 0;
    let invalidIndex;
    dishes.forEach((dish, index) => {       // since dishes is an array that can be any length, loop through each dish
        if (!dish.quantity > 0 || typeof(dish.quantity) !== 'number') {     // quantity property of dish must be an integer larger than 0
            invalidIndex = index;
            invalid++;
        }
    })
    if (invalid > 0) {
        next({status: 400, message: `Dish ${invalidIndex} must have a quantity that is an integer greater than 0`})
    }
    next();
}

function statusIsValidForUpdate (req, res, next) {      // FOR UPDATE REQUESTS check that order status is present in order and that it is not invalid
    const { data: { status } } = req.body;
    if (!status || status.length == 0){
        return next({
                status: 400,
                message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
            });
         } else if (status === "invalid"){
           return next({
                status: 400,
                message: `status`
            });
         }
    next();
}

function statusIsValid (req, res, next) {           // FOR DELETE REQUESTS check that order status IS pending
    const order = res.locals.order;
    if (order.status == "pending") {
        //console.log("delete")
        next();
    }
    return next({
        status: 400,
        message: `An order cannot be deleted unless it is pending.`
    });
}

function bodyDataHas(propertyName) {            // modular function to check that the request body contains a particular property. will be used for "deliverTo", "mobileNumber", and "dishes" properties
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName] && data[propertyName] !== "") {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
  }

module.exports = {
    list,
    create: [bodyDataHas("deliverTo"),
            bodyDataHas("mobileNumber"),
            bodyDataHas("dishes"),
            dishesIsValid,
            quantityIsValid,
            create],
    read: [orderExists, read],
    update: [orderExists,
            idMatchesOrder,
            statusIsValidForUpdate,
            bodyDataHas("deliverTo"),
            bodyDataHas("mobileNumber"),
            bodyDataHas("dishes"),
            dishesIsValid,
            quantityIsValid,
            update],
    delete: [ orderExists, statusIsValid, destroy ]
}