/*! Built with http://stenciljs.com */
const { h, Context } = window.aikuma;

class Buttony {
    constructor() {
        this.size = '50';
        this.id = null;
        this.clear = false;
        this.trackTouchIdentifier = null;
        this.mouseDown = false;
    }
    // 
    // Lifecycle
    //
    componentDidLoad() {
        console.log('buttony did load', this.id, this.clear);
        this.wrapper = this.el.querySelector('.wrapper');
    }
    // Logic
    //
    doRipple(xp, yp) {
        let pos = this.wrapper.getBoundingClientRect();
        let rippler = document.createElement('span');
        let size = this.wrapper.offsetWidth;
        let x = xp - pos.left - (size / 2);
        let y = yp - pos.top - (size / 2);
        let style = 'top:' + y + 'px; left:' + x + 'px; height: '
            + size + 'px; width: ' + size + 'px;';
        rippler.setAttribute('style', style);
        rippler.classList.add('ripple');
        this.wrapper.appendChild(rippler);
        setTimeout(() => {
            rippler.remove();
        }, 250);
    }
    touchEvent(evt) {
        if (this.disabled) {
            return;
        }
        let touch = evt.changedTouches[0];
        if (evt.type === 'touchstart' && !this.trackTouchIdentifier) {
            evt.preventDefault();
            this.sendEvent('down');
            this.doRipple(touch.pageX, touch.pageY);
            this.trackTouchIdentifier = touch.identifier;
        }
        else if (evt.type === 'touchend') {
            let fTouch = Array.from(evt.changedTouches).find(x => x.identifier === this.trackTouchIdentifier);
            if (fTouch) {
                evt.preventDefault();
                this.sendEvent('up');
                this.trackTouchIdentifier = null;
            }
        }
    }
    mouseEvent(evt) {
        if (this.disabled) {
            return;
        }
        if (evt.type === 'mousedown') {
            evt.preventDefault();
            this.sendEvent('down');
            this.mouseDown = true;
            this.doRipple(evt.pageX, evt.pageY);
        }
        else if (evt.type === 'mouseup' && this.mouseDown) {
            evt.preventDefault();
            this.sendEvent('up');
            this.mouseDown = false;
        }
        else if (evt.type === 'mouseleave' &&
            (evt.buttons & 1) && // mouse is down
            this.mouseDown // only trigger up if we moused down on this element
        ) {
            this.sendEvent('up');
            this.mouseDown = false;
        }
    }
    sendEvent(type) {
        this.clickEvent.emit({ id: this.id, type: type });
    }
    render() {
        return (h("div", { onTouchStart: this.touchEvent.bind(this), onTouchEnd: this.touchEvent.bind(this), onMouseDown: this.mouseEvent.bind(this), onMouseUp: this.mouseEvent.bind(this), onMouseLeave: this.mouseEvent.bind(this), style: {
                width: this.size + 'px',
                height: this.size + 'px'
            }, class: 'wrapper ' +
                (this.disabled ? 'disabled' : '') },
            !this.clear ?
                h("div", { class: "background", style: this.color && !this.disabled ? { backgroundColor: this.color } : {} }) :
                null,
            h("div", { class: 'contents ' + (this.clear ? 'clear' : '') },
                h("slot", null))));
    }
    static get is() { return "aikuma-buttony"; }
    static get properties() { return { "clear": { "type": Boolean, "attr": "clear" }, "color": { "type": String, "attr": "color" }, "disabled": { "type": Boolean, "attr": "disabled" }, "el": { "elementRef": true }, "id": { "type": String, "attr": "id" }, "size": { "type": String, "attr": "size" } }; }
    static get events() { return [{ "name": "clickEvent", "method": "clickEvent", "bubbles": true, "cancelable": true, "composed": true }]; }
    static get style() { return "aikuma-buttony {\n  position: relative;\n  z-index: 10;\n}\n\naikuma-buttony .wrapper {\n  position: relative;\n  top: 0;\n  left: 0;\n  margin: 2px;\n  overflow: hidden;\n}\n\naikuma-buttony .wrapper .background {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  z-index: -1;\n  border-radius: 100%;\n  background-color: var(--app-primary-color);\n}\n\naikuma-buttony .wrapper .contents {\n  z-index: 1;\n  color: white;\n  user-select: none;\n  width: 100%;\n  height: 100%;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\naikuma-buttony .wrapper .contents.clear {\n  color: var(--app-primary-color);\n}\n\naikuma-buttony .wrapper .ripple {\n  transform: scale(0);\n  border-radius: 100%;\n  position: absolute;\n  opacity: 0.75;\n  background-color: #fff;\n  animation: ripple 250ms;\n  z-index: 5;\n  pointer-events: none;\n}\n\naikuma-buttony .wrapper.disabled .background {\n  background-color: var(--app-disabled-color);\n}\n\naikuma-buttony .wrapper.disabled .contents {\n  opacity: 0.7;\n}\n\naikuma-buttony .wrapper.disabled .contents.clear {\n  color: var(--app-disabled-color);\n}\n\n\@keyframes ripple {\n  to {\n    opacity: 0;\n    transform: scale(2);\n  }\n}"; }
}

class Modal {
    constructor() {
        this.state = {
            showDialog: false
        };
        this.cbs = { dialog: null };
    }
    // watchHandler(size: {content: DOMRect, frame: DOMRect}) {
    // }
    // 
    //  Class Variables
    //
    // 
    // Lifecycle
    //
    componentDidLoad() {
        console.log('dialog did load');
    }
    // 
    // Public methods
    //
    presentDialog(title, message, confirm, cancel = null) {
        return new Promise((resolve) => {
            this.dialog = {
                title: title,
                message: message,
                confirm: confirm,
                cancel: cancel
            };
            this.state = Object.assign({}, this.state, { showDialog: true });
            this.cbs.dialog = (val) => {
                this.cbs.dialog = null;
                this.state = Object.assign({}, this.state, { showDialog: false });
                resolve(val);
            };
        });
    }
    //
    // Logic
    //
    dialogConfirm() {
        console.log('conf', typeof this.cbs.dialog);
        if (typeof this.cbs.dialog === 'function') {
            this.cbs.dialog(true);
        }
    }
    dialogCancel() {
        if (typeof this.cbs.dialog === 'function') {
            this.cbs.dialog(false);
        }
    }
    // 
    // Render
    //
    render() {
        if (this.state.showDialog) {
            return (h("div", { class: "dialog" },
                h("div", { class: "title" }, this.dialog.title),
                h("div", { class: "message" }, this.dialog.message),
                h("div", { class: "buttons" },
                    h("button", { class: "confirm", onClick: this.dialogConfirm.bind(this) },
                        h("span", { class: "btext" }, this.dialog.confirm)),
                    this.dialog.cancel ?
                        h("button", { class: "cancel", onClick: this.dialogCancel.bind(this) },
                            h("span", { class: "btext" }, this.dialog.cancel)) :
                        null)));
        }
        else {
            return null;
        }
    }
    static get is() { return "aikuma-modal"; }
    static get properties() { return { "el": { "elementRef": true }, "presentDialog": { "method": true }, "state": { "state": true } }; }
    static get style() { return "aikuma-modal {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  top: 0;\n  left: 0;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  z-index: 10;\n  pointer-events: none;\n}\n\naikuma-modal .dialog {\n  pointer-events: auto;\n  background-color: var(--app-background-color);\n  display: flex;\n  flex-direction: column;\n  z-index: 10;\n  min-width: 320px;\n}\n\naikuma-modal .dialog .title {\n  background-color: var(--app-primary-color);\n  height: 28px;\n  font-weight: bold;\n  font-size: 18px;\n  padding: 8px;\n  color: white;\n  text-transform: capitalize;\n}\n\naikuma-modal .dialog .message {\n  padding: 8px;\n  font-size: 16px;\n  text-transform: capitalize;\n}\n\naikuma-modal .dialog .buttons {\n  padding: 8px;\n  display: flex;\n  flex-direction: row;\n  justify-content: space-between;\n}\n\naikuma-modal .dialog .buttons .btext {\n  text-transform: uppercase;\n  font-weight: bold;\n}"; }
}

export { Buttony as AikumaButtony, Modal as AikumaModal };
