var path = require('path')
var fs = require('fs')
var logger = require('../libs/logger')

//Main variable to store table data.

var menuTable = [];

try {
   //file in format
   /*
    Dish1(every day different) - 4.50 $,
    Dish2(every day different) - 1.50 $,
    ...
   */
    //var menu = fs.readFileSync(path.join(__dirname ,   '../menu/menu1.txt'), 'utf8');
    var menu = fs.readFileSync(path.join(__dirname ,   '../menu/kolorado.txt'), 'utf8');
    let arr = menu.split('zł,');


    arr.forEach(function(element) {
      let index1 = element.lastIndexOf('-') + 1;
      let index2 = element.length - 1;
      let price = element.substr(index1,  index2);
      if(element !== undefined && element.length > 0){
        menuTable.push( { name: element + '', val: parseFloat(price.trim()).toFixed(2) });
        logger.info(" add element to menu: *" + element + "*");
      }
    });
    //console.log(app.locals.menuTable);

} catch(e) {
    logger.error('Error:' +  e.stack);
}

module.exports = JSON.stringify(menuTable)
