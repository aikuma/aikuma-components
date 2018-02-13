/*! Built with http://stenciljs.com */
const { h, Context } = window.aikuma;

class Buttony {
    constructor() {
        this.size = '50';
        this.id = null;
        this.trackTouchIdentifier = null;
        this.mouseDown = false;
    }
    // 
    // Lifecycle
    //
    componentDidLoad() {
        console.log('buttony did load');
        this.wrapper = this.el.querySelector('.wrapper');
    }
    //
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
            h("div", { class: "background", style: {
                    backgroundColor: this.disabled ? '#aaa' : this.color
                } }),
            h("div", { class: "contents" },
                h("slot", null))));
    }
    static get is() { return "aikuma-buttony"; }
    static get properties() { return { "color": { "type": String, "attr": "color" }, "disabled": { "type": Boolean, "attr": "disabled" }, "el": { "elementRef": true }, "id": { "type": String, "attr": "id" }, "size": { "type": String, "attr": "size" } }; }
    static get events() { return [{ "name": "clickEvent", "method": "clickEvent", "bubbles": true, "cancelable": true, "composed": true }]; }
    static get style() { return "aikuma-buttony {\n  position: relative;\n}\n\naikuma-buttony .wrapper {\n  position: relative;\n  top: 0;\n  left: 0;\n  margin: 2px;\n  overflow: hidden;\n}\n\naikuma-buttony .wrapper .background {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  z-index: -1;\n  border-radius: 100%;\n  background-color: #55f;\n}\n\naikuma-buttony .wrapper .contents {\n  z-index: 1;\n  color: white;\n  user-select: none;\n  width: 100%;\n  height: 100%;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\naikuma-buttony .wrapper .ripple {\n  transform: scale(0);\n  border-radius: 100%;\n  position: absolute;\n  opacity: 0.75;\n  background-color: #fff;\n  animation: ripple 250ms;\n  z-index: 5;\n  pointer-events: none;\n}\n\naikuma-buttony .wrapper.disabled .background {\n  background-color: #ccc;\n}\n\naikuma-buttony .wrapper.disabled .contents {\n  opacity: 0.7;\n}\n\n\@keyframes ripple {\n  to {\n    opacity: 0;\n    transform: scale(2);\n  }\n}"; }
}

export { Buttony as AikumaButtony };
