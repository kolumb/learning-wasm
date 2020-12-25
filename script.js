// console.log(module.add(1, 2));
// console.log(module.double(12));
console.log(module.fib(10));
const display = document.createElement('span')
display.textContent = module.fib(10)
document.querySelector('body').appendChild(display);
