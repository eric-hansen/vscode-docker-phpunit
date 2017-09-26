'use strict';

import * as vscode from 'vscode';
import * as _ from 'lodash';
import { Docker } from './docker';
import { PhpUnit } from './phpunit';

export function activate(context: vscode.ExtensionContext) {

    let outputChannel = vscode.window.createOutputChannel('docker-phpunit')
    let docker = new Docker(outputChannel)
    let phpunit = new PhpUnit(docker)

    let commandsToRegister = [
        vscode.commands.registerCommand('docker_phpunit.setPhpunitDockerContainerName', docker.updatePhpUnitDockerName),
        vscode.commands.registerCommand('docker_phpunit.getPhpUnitVersion', phpunit.getPhpUnitVersion),
        vscode.commands.registerCommand('docker_phpunit.runAllTestsInDirectory', phpunit.runAllTestsInDirectory),
        vscode.commands.registerCommand('docker_phpunit.runAllTestsInClass', phpunit.runAllTestsInClass),
        vscode.commands.registerCommand('docker_phpunit.runSpecificTestInClass', phpunit.runSpecificTestInClass),
        vscode.commands.registerCommand('docker_phpunit.pickClassOrMethodToTest', phpunit.pickFileClassOrMethodToRunFromQuickPick)
    ];

    _.each(commandsToRegister, function (command) {
        context.subscriptions.push(command);
    });
}

export function deactivate() {
}