/*! Built with http://stenciljs.com */
const { h, Context } = window.aikuma;

class TranslateIGV {
    componentWillLoad() {
        console.log('TIGV is about to be rendered');
    }
    componentDidLoad() {
        console.log('TIGV was rendered');
        this.init();
    }
    init() {
    }
    render() {
        return (h("aikuma-slide-show", null));
    }
    static get is() { return "aikuma-translate-igv"; }
    static get encapsulation() { return "shadow"; }
    static get style() { return ""; }
}

export { TranslateIGV as AikumaTranslateIgv };
