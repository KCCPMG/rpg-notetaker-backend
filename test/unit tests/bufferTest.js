const fs = require('fs');



const buf = Buffer.from("HHH!");

console.log(buf[0], buf[1], buf[2], buf[3]);
console.log(buf);
console.log(buf.toString());

let bufImage = Buffer.from(fs.readFileSync('../test files/Sex Panther.jpg'));
let bufImageCopy = Buffer.alloc(bufImage.length);
bufImageCopy.set(bufImage);
console.log(bufImage);

console.log(bufImage == bufImageCopy);
console.log(bufImage.length == bufImageCopy.length);
for (i=0; i<bufImage.length; i++) {
  if (bufImage[i] != bufImageCopy[i]) {
    console.log(false, i, bufImage[i], bufImageCopy[i]);
  }
}

fs.writeFileSync('../test files/Sex Panther Copy.jpg', bufImageCopy);