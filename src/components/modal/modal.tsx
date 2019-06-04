import { Component, Element, State, Method } from '@stencil/core'
import { h } from '@stencil/core'

interface State {
  showDialog: boolean
}

@Component({
  tag: 'aikuma-modal',
  styleUrl: 'modal.scss'
})
export class Modal {
  @Element() el: HTMLElement
  @State() state: State = {
    showDialog: false
  }
  dialog: {title: string, message: string, confirm: string, cancel?: string}
  cbs: {dialog: Function} = {dialog: null}
  // watchHandler(size: {content: DOMRect, frame: DOMRect}) {
   
  // }

  // 
  //  Class Variables
  //

  // 
  // Lifecycle
  //
  // componentDidLoad() {
  //   console.log('dialog did load')
  // }

  // 
  // Public methods
  //
  @Method()
  presentDialog(title: string, message: string, confirm: string, cancel: string = null): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialog = {
        title: title,
        message: message,
        confirm: confirm,
        cancel: cancel
      }
      this.state = {...this.state, showDialog: true}
      this.cbs.dialog = (val: boolean) => {
        this.cbs.dialog = null
        this.state = {...this.state, showDialog: false}
        resolve(val)
      }
    })
  }
  //
  // Logic
  //
  
  dialogConfirm() {
    console.log('conf', typeof this.cbs.dialog)
    if (typeof this.cbs.dialog === 'function') {
      this.cbs.dialog(true)
    }
  }
  dialogCancel() {
    if (typeof this.cbs.dialog === 'function') {
      this.cbs.dialog(false)
    }
  }
  // 
  // Render
  //
  render() {
    if (this.state.showDialog) {
      return (
        <div class="dialog">
        <div class="title">{this.dialog.title}</div>
        <div class="message">{this.dialog.message}</div>
        <div class="buttons">
          <button class="confirm" onClick={this.dialogConfirm.bind(this)}>
            <span class="btext">{this.dialog.confirm}</span>
          </button>
          {
            this.dialog.cancel ? 
              <button class="cancel" onClick={this.dialogCancel.bind(this)}>
                <span class="btext">{this.dialog.cancel}</span></button> : 
              null
          }
        </div>
      </div>
      )
    } else {
      return null
    }
  }
}
