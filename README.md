# jonitor.js
A runtime verification tool for JavaScript web applications.



## Runtime verification

Runtime verification is a method to verify a system's behaviour at runtime. Runtime verification is typically divided in the following parts:

* system - the system under test
* intrumentation - the process by which the monitor becomes attached to the system
* monitor - the core of the runtime verification that performs the verification
* properties - the properties that the monitor uses to check the system's behaviour

The monitor must be built according to the system under test, however, in the following sections we will look into how **jonitor.js** achieves instrumentation and how are the properties used.

### Instrumentation

Since **jonitor.js** supports JavaScript web applications, **jonitor.js** makes use of the global object `window`. Hence, the functions that the user intends to capture are overriden so that an extra two functions that will perform the runtime verification are executed before and after the original function while the behaviour of the original function is preserved.

### Properties

Properties are written in the form of a guarded command language and must be included in the file **properties.prts**. Properties are written in the form of **w : e | c -> a** where **w** determines whether the property should be triggered before or after the captured function, **e** is the event that triggers the condition, and **a** is the command that is executed whenever condition **c** evaluates to true.

An example:

```
// b // registerNewAccount // return jonitor.registration.invalidLengths // console.error("\n\nError: registration should not have been called since there were invalid lengths\n\n\n");//
```
