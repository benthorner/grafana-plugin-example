# grafana-plugin-example

## Getting Started

### Babel

From the documentation: https://babeljs.io.

    npm init -y
    npm install --save-dev babel-cli babel-preset-env

    # .babelrc
    {
      "presets": ["env"]
    }

Now let's create a simple pair of modules.

    # src/class.js
    class MyClass {
      myMethod (arg) {
        console.log(3)
      }
    }

    # src/main.js
    import MyClass from './class'
    (new MyClass()).myMethod(3)

Then transpile, check the output and run.

    babel src -d dist
    cat dist/class.js
    cat dist/main.js
    node dist/main.js

### Grunt

First install grunt and the babel plugin.

    sudo npm install -g grunt-cli
    npm install --save-dev grunt grunt-babel

Let's use the [example](https://github.com/babel/grunt-babel) to transpile our files.

    # Gruntfile.js
    module.exports = function(grunt) {
      grunt.loadNpmTasks('grunt-babel')

      grunt.initConfig({
        babel: {
          src: {
            files: {
              'dist/main.js': 'src/main.js',
              'dist/class.js': 'src/class.js'
            }
          }
        }
      })

      grunt.registerTask('default', ['babel'])
    }

Grunt has a way to make this more flexible.

    # Gruntfile.js
    babel: {
      src: {
        files: [{
          cwd: 'src',
          src: ['**/*.js'],
          expand: true,
          dest: 'dist'
        }]
      }
    }

Running grunt should now do the same thing.

### Grafana

Start by telling Grafana about our plugin.

    # src/plugin.json
    {
      "type": "panel",
      "name": "MyPlugin",
      "id": "my-plugin"
    }

We'll need grunt to copy this into dist.

    npm install --save-dev grunt-contrib-copy grunt-contrib-clean

    # Gruntfile.js
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-copy')

    clean: ['dist'],

    copy: {
      src: {
        cwd: 'src',
        expand: true,
        src: ['**/*'],
        dest: 'dist'
      }
    }

    rm src/main.js src/class.js 
    grunt

Now we define our module controller.

    # src/module.js (angular)
    import {MetricsPanelCtrl} from 'app/plugins/sdk'

    export class PanelCtrl extends MetricsPanelCtrl {
      constructor ($scope, $injector) {
        super($scope, $injector)
      }
    }

    PanelCtrl.templateUrl = 'module.html'

And finally try it in a test dashboard.

    docker run -it -v $PWD:/var/lib/grafana/plugins/my_plugin -p 3000:3000 --name grafana grafana/grafana

You should see a blank panel (no html).

### Grunt (Again)

Running grunt repeatedly is annoying.

    npm install --save-dev grunt-contrib-watch

    # Gruntfile.js
    grunt.loadNpmTasks('grunt-contrib-watch')

    watch: {
      src: {
        files: ['src/**/*'],
        tasks: ['default']
      }
    }

## Make it Work

### Data, View and Options

Start by showing a dot for each series.

    # src/module.js (constructor)
    this.events.on('data-received', this.onDataReceived.bind(this))

    # src/module.js
    onDataReceived (data) {
      this.data = data
      console.log(data)
    }

    # src/modules.html
    <div ng-repeat="dot in ctrl.data">
      <div style="background: blue; border-radius: 25px; width: 25px; height: 25px"/>
    </div>

Now let's make the radius configurable.

    # src/module.js (constructor)
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this))

    # src/module.js
    onInitEditMode () {
      this.addEditorTab('Options', 'public/plugins/my-plugin/editor.html')
    }

    # src/editor.html
    <div class="editor-row">
      <div class="section gf-form-group">
        <h5 class="section-heading">General</h5>

        <div class="gf-form">
          <label class="gf-form-label width-10">Radius</label>
          <input class="input-small gf-form-input width-10" ng-model="ctrl.panel.radius"/>
        </div>
      </div>
    </div>

    # src/module.html
    <div ng-repeat="series in ctrl.data">
      <div style="background: blue; border-radius: {{ ctrl.panel.radius }}; width: {{ ctrl.panel.radius }}; height: {{ ctrl.panel.radius }}"/>
    </div>

The radius should be set by default.

    # src/module.js
    const panelDefaults = {
      radius: '70px'
    }

    # src/module.js (constructor)
    _.defaults(this.panel, panelDefaults)

### Builder / Presenter Pipeline

Let's start to work with our data.

    # src/util/builder.js
    export class Builder {
      call (data) {
        return data.map(series => { 
          return { value: series.datapoints[series.datapoints.length-1][0] }
        })
      }
    }

    # src/util/presenter.js
    export class Presenter {
      call (dots) {
        dots.forEach(dot => dot.color = 'red')
      }
    }

    # src/module.js
    import {Builder} from './util/builder'
    import {Presenter} from './util/presenter'

    # src/module.js (onDataReceived)
    this.data = new Builder().call(data)
    new Presenter().call(this.data)

Note that `module.js` can't be tested.

### The Need for OnRender

Let's make the dot color configurable.

    # src/editor.html
    <div class="section gf-form-group">
      <h5 class="section-heading">Colors</h5>

      <div class="gf-form" ng-repeat="threshold in ctrl.panel.thresholds">
        <label class="gf-form-label width-10">Threshold {{$index + 1}}</label>
        <input class="input-small gf-form-input width-10" ng-model="threshold.value"/>
        <label class="gf-form-label">
          <spectrum-picker ng-model="threshold.color"/>
        </label>
      </div>
    </div>

    # src/util/presenter.js
    export class Presenter {
      constructor(panel) {
        this.panel = panel
      }

      call (dots) {
        dots.forEach(dot => {
          this.panel.thresholds.forEach(threshold => {
            if (dot.value > parseFloat(threshold.value)) {
              dot.color = threshold.color
            }
          })
        })
      }
    }

    # src/module.html
    <div style="background: {{ dot.color }}; ...

    # src/module.js (panelDefaults)
    thresholds: [{ value: '60', color: 'rgb(120,35,35)' }]

Changing the options should change the dot.

    # src/editor.html (input, spectrum-picker)
    ng-change="ctrl.render()"

    # src/module.js (constructor)
    this.events.on('render', this.onRender.bind(this))
    this.data =[]

    # src/modules.js
    onDataReceived (data) {
      this.data = data
      this.onRender()
    }

    onRender() {
      this.dots = new Builder().call(this.data)
      new Presenter(this.panel).call(this.dots)
    }

    # src/module.html
    <div ng-repeat="dot in ctrl.dots">

## Testing

We can unit test our util classes.

    npm install -save-dev jasmine

    # spec/util/builder_spec.js
    import {Builder} from '../../src/util/builder'

    describe('Builder', () => {
      let subject

      beforeEach(() => {
        subject = new Builder()
      })

      describe('call', () => {
        it('builds a dot from the last value of each series', () => {
          let series = { datapoints: [[1, 'ts'], [2, 'ts']] }
          let dots = subject.call([series])
          expect(dots.length).toEqual(1)
          expect(dots[0].value).toEqual(2)
        })
      })
    })

    # spec/support/jasmine.json
    {
      "spec_dir": "spec",
      "spec_files": ["**/*.js"],
      "helpers": ["../node_modules/babel-register/lib/node.js"],
      "random": true
    }

    # Gruntfile.js
    grunt.loadNpmTasks('grunt-exec')

    exec: {
      jasmine: {
        cmd: 'node_modules/jasmine/bin/jasmine.js'
      }
    }

    grunt.registerTask('test', 'exec:jasmine')
