# vscode-docker-phpunit README

## How To Use

This is inspired by the PHPUnit extension written that I contributed to.  However, this offers design decisions based on how I felt it should function.  vscode-docker-phpunit also will not be a drop-in replacement.  This is intended to execute PHPUnit found within a Docker container.

Make sure you have PHPUnit (tested/used against 4.7.x) in the container.  Set the phpunit.exec and phpunit.code_path values of the container.  Also set the phpunit.docker_name config or use the supplied command.

From this point just run one of the various Docker-PHPUnit methods to run a test class/method/directory.  A new output channel is created with the PHPUnit output along with some extension-specific info (container name and command executed).

## Configuration

```
{
  "phpunit": {
    "exec": "/path/in/container/to/phpunit",
    "extra_params": [],
    "docker_name": "",
    "code_path": "/var/www/html"
  }
}
```

Explanations:

* `exec` - The PHPUnit binary to use (defaults to `phpunit` when not set)
* `extra_params` - Pass these extra params to all PHPUnit calls.  I.e.: for Symfony2 you may need to set this to `['-c', '/path/too/app/phpunit.xml.dist']` for example
* `docker_name` - The name of the Docker container.  If not set, you will need to run the `Docker-PHPUnit: Save container name` command first
* `code_path` - The path within the container where your code is located

## Commands

The following commands are usable:

* `Docker-PHPUnit: Save container name` - Displays a list of running containers' names to set the `docker_name` property
* `Docker-PHPUnit: Validate config and display version` - Acts a config validation that everything will work and also outputs the PHPUnit version from the container if all is well
* `Docker-PHPUnit: Run tests within the active editor directory` - Runs all the test classes within the directory of the focused/active editor if the filename ends in `.php`
* `Docker-PHPUnit: Run all tests within the current editor window` - Runs all test methods within the currently focused file
* `Docker-PHPUnit: Run test cursor is currently inside of or on` - Run the test currently focused in (either by cursor or by looking backwards)
* `Docker-PHPUnit: Choose the test method, class or file to run` - Displays a pick window to choose the specific method, class or file to run