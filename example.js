var inquirer = require('inquirer')

inquirer.registerPrompt('number', require('./index'));

inquirer.prompt([{
    type: 'number',
    message: 'how old are you?',
    name: 'value',
    default: 12,
    max: 100,
    min: 2,
        transformer: function(number, answers, flags) {
        if (flags.isFinal) {
          return number+ '!!';
        }
        return number;
    }
}])
.then(console.log)