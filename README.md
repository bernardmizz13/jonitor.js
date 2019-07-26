# jonitor.js
A runtime verification tool for JavaScript web applications.



## Runtime verification

Runtime verification is a method to verify a system's behaviour at runtime. Runtime verification is typically divided in the following parts:

* system - the system under test
* intrumentation - the process by which the monitor becomes attached to the system
* monitor - the core of the runtime verification that performs the verification
* properties - the properties that the monitor uses to check the system's behaviour

Moreover, the monitor must be built according to the system under test. In the following sections we will look into how **jonitor.js** achieves instrumentation and how are the properties used.

### Instrumentation

Since **jonitor.js** supports JavaScript web applications, **jonitor.js** makes use of the global object `window`. Hence, the functions that the user intends to capture are overriden so that an extra two functions that will perform the runtime verification are executed before and after the original function while the behaviour of the original function is preserved.

### Properties

Properties are written in the form of a guarded command language and must be included in the file **properties.prts**. Properties take the form of **w : e | c -> a** where **w** determines whether the property should be triggered before or after the captured function, **e** is the event that triggers the condition, and **a** is the command that is executed whenever condition **c** evaluates to true.

The property’s syntax is:

```
// when // event // condition // action //
```
* **When** Properties must fire before or after the captured function; if before include a **b**, else if after include an **a**.
* **Event**  Along with the before or after, the event will trigger the entire property. The event must include the name of the function that needs to be captured.
* **Condition** The condition is immediately checked when the event triggers the property. Conditions are standard JavaScript code that is executed; hence, they must be included with a **return** in front. To include more than one condition, they must be separated with **||** or **&&**, but only one return statement must exist. The captured function’s arguments may be referred to by including **jonitor.currentArgs**. Here, one may include any references to methods, objects, variables or any other data structure that is defined in **jonitor.js** or elsewhere and that can be used to evaluate the condition. However, note that whichever statement is included after return can only be evaluated to true or false.
* **Action** If the condition evaluates to true, **jonitor** executes the action. Once again, the action is executed as JavaScript code, and so, any number of statements can be included. Likewise, one may again refer to any defined data structures. The captured event’s return value may be referred to by including **jonitor.returnValue**.

An example:
```
// b // registerNewAccount // return jonitor.registration.invalidLengths // console.error("\n\nError: registration should not have been called since there were invalid lengths\n\n\n");//
```
Another example:

```
// a // checkLength // return (jonitor.currentArgs[0].length < jonitor.validLength || jonitor.currentArgs[0].length > jonitor.currentArgs[2]) && jonitor.returnValue // Console.error("\n\nError: length is invalid");\\
```

If one requires executing the action irrelevant whether or not the condition returns true
or false, then the condition must be `return true`:

```
// a // checkCollision // return true // jonitor.updateCarPosition(); //
```

### Captured events

In order to instrument the required functions, the user must include the name of the functions comma seperated in object `allowedEvents`, this is located in **jonitor.js**.

### Installation

To successfully use **jonitor.js** include the following in your respective HTML/PHP file:

```
<script  type="text/javascript" src="jonitor.js"></script>
```
