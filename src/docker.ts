'use strict';

import * as docker from 'dockerode';
import * as _ from 'lodash';
//import {workspace, OutputChannel, window} from 'vscode';
import * as vscode from 'vscode';

export class Docker {
  private instance: docker;

  constructor(private readonly outputWindow: vscode.OutputChannel)
  {
    this.instance = new docker()
  }

  public getContainerName = (): string => {
    return vscode.workspace.getConfiguration('phpunit').get('docker_name', '')
  }

  private writeMessage = (msg: string, isDebug?: boolean) => {
    if (isDebug && isDebug === true) {
      msg = '> Docker-PHPUnit: ' + msg
    }

    this.outputWindow.append(msg)
  }

  private writeMessageLine = (msg: string, isDebug?: boolean) => {
    this.writeMessage(msg + '\n', isDebug)
  }

  public exec(cmd: string): Thenable<boolean> {
    let that = this

    return new Promise(function (resolve, reject) {
      if (!cmd || cmd.length < 1) {
        that.writeMessageLine('No command provided', true)

        return resolve(false)
      }

      that.outputWindow.show(false);
      that.outputWindow.clear()

      let container = that.instance.getContainer(that.getContainerName())

      that.writeMessageLine("Container: " + that.getContainerName())
      that.writeMessageLine("Command: " + cmd + "\n")

      container.exec({
        "AttachStdout": true,
        "AttachStderr": true,
        "AttachStdin": false,
        "Tty": false,
        "Cmd": cmd.split(" ")
      }).then(function (execObject, err) {
        execObject.start(function (err, stream) {
          let handler = {
            write: function (data) {
              data = data.toString()
              that.writeMessage(data)
            }
          }

          container.modem.demuxStream(stream, handler, handler)
        })
      })
    })
  }

  public updatePhpUnitDockerName = () => {
    let config = vscode.workspace.getConfiguration('phpunit');

    let that = this;

    this.instance.listContainers().then(function (containerObjects) {
      let items = []

      _.each(containerObjects, function (container) {
        items.push(container.Names[0].substring(1))
      });

      if (items && items.length > 0) {
        vscode.window.showQuickPick(items, {
          placeHolder: 'Currently set Docker container: '+config.get('docker_name', 'N/A')
        }).then(function (selectedItem) {
          if (selectedItem !== undefined && selectedItem !== config.get('docker_name', '')) {
            config.update('docker_name', selectedItem, false).then(function (result) {
              vscode.window.showInformationMessage('Updated Docker container for proejct to ' + selectedItem)
            })
          }
        })
      } else {
        vscode.window.showErrorMessage('No running Docker containers found.')
      }
    }).catch(function (err) {
      this.writeMessageLine(err, true)
    })
  }
}