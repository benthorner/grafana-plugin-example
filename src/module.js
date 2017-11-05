import _ from 'lodash'
import {MetricsPanelCtrl} from 'app/plugins/sdk'
import {Builder} from './util/builder'
import {Presenter} from './util/presenter'

const panelDefaults = {
  radius: '70px',
  thresholds: [{ value: '60', color: 'rgb(120, 35, 35)' }]
}

export class PanelCtrl extends MetricsPanelCtrl {
  constructor ($scope, $injector) {
    super($scope, $injector)
    _.defaults(this.panel, panelDefaults)

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this))
    this.events.on('data-received', this.onDataReceived.bind(this))
    this.events.on('render', this.onRender.bind(this))
    this.data = []
  }

  onInitEditMode () {
    this.addEditorTab('Options', 'public/plugins/my-plugin/editor.html')
  }

  onDataReceived (data) {
    this.data = data
    this.onRender()
  }

  onRender () {
    this.dots = new Builder().call(this.data)
    new Presenter(this.panel).call(this.dots)
  }
}

PanelCtrl.templateUrl = 'module.html'
