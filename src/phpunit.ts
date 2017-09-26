'use strict';

import { workspace, window } from 'vscode';
import * as path from 'path';
import * as _ from 'lodash';
import { Docker } from './docker';

export class PhpUnit {
  constructor(private readonly docker: Docker) {
  }

  private convertLocalPathToContainerPath = (localPath: string): string => {
    let codePath = workspace.getConfiguration('phpunit').get('code_path', '/var/www/html')
    let workPath = workspace.workspaceFolders[0].uri.path

    return localPath.toString().replace(workPath, codePath)
  }

  private run = (args: Array<string>): Thenable<boolean> => {
    let that = this

    return new Promise(function (resolve, reject) {
      let config = workspace.getConfiguration('phpunit')

      args = _.union(config.get('extra_params', []), args)

      that.docker.exec(config.get('exec') + ' ' + args.join(' ')).then(function (result) {
        resolve(result)
      })
    })
  }

  private convertDocumentPathToContainerResource = (resolvePathOnly?: boolean): Thenable<string> => {
    let that = this

    return new Promise(function (resolve, reject) {
      let result = undefined
      let editor = window.activeTextEditor

      if (editor !== undefined) {
        let document = editor.document

        if (document && !document.isUntitled && document.uri && document.uri.fsPath.endsWith('.php')) {
          let docPath = document.uri.fsPath
          let data = resolvePathOnly ? path.dirname(docPath) : docPath

          result = that.convertLocalPathToContainerPath(data)
        }
      }

      resolve(result)
    })
  }

  private getClassNameFromCurrentTest = (): Thenable<string> => {
    return new Promise(function (resolve, reject) {
      let editor = window.activeTextEditor
      let regex = /class\s+(\w*)\s*{?/gi
      
      if (!editor || !editor.document) {
        return resolve(undefined)
      }

      let text = editor.document.getText()
      let result = undefined

      while ((result = regex.exec(text))) {
        return resolve(result[1].toString().trim())
      }
    })
  }

  private getCurrentTestMethod = (): Thenable<string> => {
    return new Promise(function (resolve, reject) {
      let editor = window.activeTextEditor
      let regex = /\s*public*\s+function\s+(\w*)\s*\(/gi
      let result = undefined

      if (editor && editor.document) {
        let text = editor.document.getText()
        let position = editor.selection.active.line

        while (position > -1) {
          let textAtLine = editor.document.lineAt(position).text

          if ((result = regex.exec(textAtLine))) {
            return resolve(result[1].toString().trim())
          }
          /**
           * The idea here is basically that if we detect a } before any regex
           * match we were in a position that wouldn't lead to a true positive.
           */
          else if (textAtLine.indexOf('}') !== -1) {
            break
          }

          position--
        }
      }
      
      return resolve(result)
    })
  }

  private getTestMethods = (excludes?: Array<string>): Thenable<Array<string>> => {
    return new Promise(function (resolve, reject) {
      let result = []
      let editor = window.activeTextEditor
      let regex = /\s*public*\s+function\s+(\w*)\s*\(/gi
      
      if (excludes.constructor !== Array) {
        excludes = []
      }

      if (editor && editor.document) {
        let text = editor.document.getText()
        let regexResult = null

        while ((regexResult = regex.exec(text))) {
          let methodName = regexResult[1].toString().trim()

          if (excludes.indexOf(methodName) === -1) {
            result.push(methodName)
          }
        }
      }

      resolve(result);
    });
  }

  public getPhpUnitVersion = () => {
    this.run(['--version'])
  }

  public runAllTestsInDirectory = () => {
    this.convertDocumentPathToContainerResource().then(function (resource) {
      this.run(resource)
    })
  }

  public runAllTestsInClass = () => {
    this.convertDocumentPathToContainerResource(false).then(function (testFile) {
      this.getClassNameFromCurrentTest().then(function (className) {
        this.run(['--filter', className, testFile])
      })
    })
  }

  public runSpecificTestInClass = () => {
    this.convertDocumentPathToContainerResource(false).then(function (testFile) {
      this.getCurrentTestMethod().then(function (methodName) {
        this.run(['--filter', methodName, testFile])
      })
    })
  }

  public pickFileClassOrMethodToRunFromQuickPick = () => {
    let that = this

    that.convertDocumentPathToContainerResource().then(function (testFile) {
      let itemsToChoose = []

      that.getClassNameFromCurrentTest().then(function (className) {
        that.getCurrentTestMethod().then(function (currentMethodName) {
          that.getTestMethods([currentMethodName]).then(function (allTestMethods) {
            if (currentMethodName) {
              itemsToChoose.push(currentMethodName)
            }

            itemsToChoose.push(className, testFile)

            _.each(allTestMethods, function (method) {
              itemsToChoose.push(method)
            })

            window.showQuickPick(itemsToChoose).then(function (testObject) {
              if (testObject !== undefined) {
                let args = ['--filter', testObject]

                if (testObject !== testFile) {
                  args.push(testFile)
                }

                that.run(args)
              }
            })
          })
        })
      })
    })
  }
}