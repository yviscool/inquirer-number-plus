'use strict';
/**
 * `number` type prompt
 */
var chalk = require('chalk');
var Base = require('inquirer/lib/prompts/base');
var observe = require('inquirer/lib/utils/events');
var ansiEscapes = require('ansi-escapes');

var { map, filter, share, takeUntil, bufferCount } = require('rxjs/operators');

var _ = require('lodash');

class NumberPrompt extends Base {

  constructor(questions, rl, answers) {
    super(questions, rl, answers)
    this.opt = _.defaults(_.clone(this.opt), {
      inc: 1,
      min: -Infinity,
      max: Infinity,
    })
    this.opt.inc = this.handleStringNumber(this.opt.inc, 1)
    this.opt.min = this.handleStringNumber(this.opt.min, -Infinity)
    this.opt.max = this.handleStringNumber(this.opt.max, Infinity)
    this.opt.default = this.handleStringNumber(this.opt.default, 0)
    this.defaultValue = this.opt.default;
    this.opt.default = null;
    this.value = this.defaultValue;
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
    // 0123456789
    events.keypress
      .pipe(...this.numberKey())
      .pipe(takeUntil(validation.success))
      .forEach(this.onNumberKey.bind(this))
    // bell 
    events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));
    // backspace
    events.keypress
      .pipe(...this.deleteKey())
      .pipe(takeUntil(validation.success))
      .forEach(this.onBackSpaceKey.bind(this));
    // gg
    events.keypress
      .pipe(...this.homeKey())
      .pipe(takeUntil(validation.success))
      .forEach(this.onHomeKey.bind(this))
    // G
    events.keypress
      .pipe(...this.endKey())
      .pipe(takeUntil(validation.success))
      .forEach(this.onEndKey.bind(this))

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

  numberKey() {
    return [
      filter(e => e.value && '0123456789'.indexOf(e.value) >= 0),
      map(e => Number(e.value)),
      share(),
    ]
  }

  // gg key events 
  homeKey() {
    return [
      filter(({ key }) => key.name === 'g' || (key.name === 'g' && key.ctrl)),
      bufferCount(2),
      share(),
    ]
  }

  // G key events 
  endKey() {
    return [
      filter(({ key }) => key.sequence === 'G' || (key.sequence === 'G' && key.ctrl)),
      share(),
    ]
  }

  deleteKey() {
    return [
      filter(({ key }) => key.name === 'backspace'),
      share(),
    ]
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
    this.value = this.keepValue(value);
    this.render();
  }

  onBackSpaceKey() {
    var strValue = String(this.value);
    var changedValue = 
            strValue.length && strValue.slice(0, -1).startsWith('-') && strValue.length == 2
            ? 0
            : Number(strValue.slice(0, -1))
    this.value = this.keepValue(changedValue);
    this.render();
  }

  onHomeKey() {
    if (this.opt.max === Infinity) {
      this.value = this.value;
    } else {
      this.value = this.opt.max;
    }
    this.render();
  }

  onEndKey() {
    if (this.opt.min === -Infinity) {
      this.value = 0;
    } else {
      this.value = this.opt.min;
    }
    this.render();
  }

  onKeypress({ key }) {
    if (
      !  Number(key.name)
      && key.name !== '0'
      && key.name !== 'j'
      && key.name !== 'k'
      && key.name !== 'g'
      && key.name !== 'up'
      && key.name !== 'down'
      && key.name !== 'backspace'
      && key.sequence !== 'G'
    ) {
      return this.bell();
    }
  }

  keepValue(value) {
    if (value >= this.opt.max) {
      return this.opt.max;
    }
    if (value <= this.opt.min) {
      return this.opt.min;
    }
    return value;
  }

  bell() {
    process.stdout.write(ansiEscapes.beep);
  }

  handleStringNumber(value, defaultvalue) {
    return Number(value) ? Number(value) : defaultvalue;
  }
}

module.exports = NumberPrompt;
