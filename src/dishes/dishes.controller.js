const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function list (req, res) {      // handle GET request for /dishes
    res.json({data: dishes})
}

function create( req, res ) {   // handle POST request for /dishes
    const { data: { name, description, price, image_url} = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    }
    dishes.push(newDish)
    res.status(201).json( {data: newDish} )
}

function read (req, res) {      // handle GET request for /dishes/:dishId
    res.json({data: res.locals.dish})
}

function update (req, res) {      // handle PUT request for /dishes/:dishId
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json( {data: dish} );
}

function bodyDataHas(propertyName) {            // modular function to check that the request body contains a particular property. will be used for 'name', 'description', and 'image_url' properties
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName] && data[propertyName] !== "") {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
  }

function priceIsValid (req, res, next) {        // checks if dish has a valid price
    const { data: { price } } = req.body;
    const priceNumber = typeof(price)
    if (!price || price <= 0 || priceNumber !== 'number') {     // price property must exist, be greater than 0, and be a number (not a string)
       return next({ status: 400, message: `Must include a price` });
    }
    next()
}

function idIsValid(req, res, next) {        // check if id of dish associated with request matches the dish in the url
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id && id !== dishId) {
        next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
     return next();
  }

function dishExists (req, res, next) {      // check if there is a dish that matches the 'dishId' param associated with a request
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`,
      });
}

module.exports = {
    list,
    create: [bodyDataHas("name"),
            bodyDataHas("description"),
            bodyDataHas("image_url"),
            priceIsValid,
            create],
    read: [dishExists, read],
    update: [dishExists,
            priceIsValid, 
            idIsValid,
            bodyDataHas("name"),
            bodyDataHas("description"),
            bodyDataHas("image_url"),
            update]
}


// still getting an error with 'update'. cant tell if it wants 400 or 404, cant figure out why its not returning 400 when they dont match. also, the instructions say to return 404 when they dont match but i guess i should just listen to the tests