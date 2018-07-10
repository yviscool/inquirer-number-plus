'use strict';
/**
 * `number` type prompt
 */
var chalk = require('chalk');
var { map, takeUntil } = require('rxjs/operators');
var Base = require('inquirer/lib/prompts/base');
var observe = require('inquirer/lib/utils/events');
var ansiEscapes = require('ansi-escapes');

var _ = require('lodash');

class InputPrompt extends Base {

  constructor(questions, rl, answers) {
    super(questions, rl, answers)
    this.opt = _.defaults(_.clone(this.opt), {
      inc: 1,
      min: -Infinity,
      max: Infinity,
    })
    this.defaultValue = this.opt.default;
    this.opt.default = null;
    this.value = this.defaultValue || 0;
    this.firstRender = true;
  }

  _run(cb) {
    this.done = cb;

    var events = observe(this.rl);
    var submit = events.line.pipe(map(this.filterInput.bind(this)));

    var validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.normalizedUpKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onUpKey.bind(this));

    events.normalizedDownKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onDownKey.bind(this));

    // // default exclude 0 
    events.numberKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onNumberKey.bind(this))

    events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));

    // Init
    this.render();
    this.firstRender = false;
    return this;
  }

  /**
   * Render the prompt to screen
   * @return {InputPrompt} self
   */

  render(error) {
    var bottomContent = '';
    var appendContent = 0;
    var message = this.getQuestion();
    var transformer = this.opt.transformer;
    var isFinal = this.status === 'answered';
    if (this.firstRender) {
      appendContent += this.value;
    }

    if (isFinal) {
      appendContent += this.answer;
    } else {
      appendContent += this.firstRender ? 0 : this.value;
    }

    this.value = Number(appendContent);

    if (transformer) {
      message += transformer(chalk.cyan.underline(appendContent), this.answers, { isFinal });
    } else {
      message += isFinal ? chalk.cyan.underline(appendContent) : chalk.cyan.underline(appendContent);
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }
    // !!! reset  line because screen will change cursor position
    this.rl.line = '';
    this.screen.render(message, bottomContent);
  }


  filterInput(input) {
    if (!input) {
      return this.defaultValue == null ? '' : this.defaultValue;
    }
    return input;
  }


  onEnd(state) {
    this.answer = this.value;
    this.status = 'answered';

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(this.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  onUpKey() {
    var line = this.value;
    if (line >= this.opt.max) return this.bell();
    this.value += this.opt.inc;
    this.render();
  }

  onDownKey() {
    var line = this.value;
    if (line <= this.opt.min) return this.bell();
    this.value -= this.opt.inc;
    this.render();
  }

  onNumberKey(value) {
    value = Number(this.value + '' + value);
    this.value = value;
    if (value >= this.opt.max) {
      this.value = this.opt.max;
    }
    if (value <= this.opt.min) {
      this.value = this.opt.min;
    }
    this.render();
  }

  onKeypress({ key }) {
    if (
      !Number(key.name)
      && key.name == 'up' 
      && key.name == 'down'
      && key.nmae == 'j'
      && key.nmae == 'k'
    ) {
      return this.bell();
    }
  }

  bell() {
    process.stdout.write(ansiEscapes.beep);
  }
}

module.exports = InputPrompt;
