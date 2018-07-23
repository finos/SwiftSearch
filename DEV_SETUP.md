## Prerequisites

### General
- You'll need a set of binaries for swift search to work. To get these binaries, please contact the project maintainers.

### Windows
- NodeJS version >= 8.9.4 (corresponds to electron 2.0.2)
- Microsoft Visual Studio 2015 Community or Paid (C++ and .NET/C# development tools)
- Python >= 2.7.1
- Dot Net 3.5 SP1

#### Notes
- C++ tools are required to recompile node modules
- Dot NET/C# tools required to compile screen-snippet module
- Open 'Developer Command Prompt for VS2015'. This sets paths to visual studio build tools

### Mac
- Xcode command line tools. Or better, XCode latest version
- NodeJS version >= 8.9.4 (corresponds to electron 2.0.2)

## Run demo:
- npm install
- npm run demo 
- 💥

## Building the Package
- npm run build

## Tests and Code Coverage
- [Jest framework](http://facebook.github.io/jest/) is used to run tests
- Use `npm test` to run unit tests
- Code coverage reports are placed in [coverage](./coverage) directory
- See the [tests](./tests) directory to find all the unit tests
