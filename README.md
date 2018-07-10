# inquirer-number-plus
Better number promt

### Installation

``` shell
npm install inquirer-number-plus
```

### Usage

```javascript
inquirer.registerPrompt('number', require('inquirer-number-plus'));

inquirer.prompt({
  type: 'number',
  ...
})
```

### options

Takes `type`, `name`, `message`, `default`,`max`,`min`,`inc`, properties.

You can type in numbers and use up/down to increase/decrease the value. Only numbers are allowed as input.
