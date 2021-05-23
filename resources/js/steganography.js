const base2 = Math.log(2);

function toBin(item, length){
    let result = "";
    for(let i=length-1; i>=0; i--) result += (item >> i) & 1;
    return result;
}

function encodeImage(image, ctx, message, secret){
    let encrypted = CryptoJS.AES.encrypt(message, secret).toString();

    let bstring = "";

    // binary header
    let pow = Math.ceil(Math.log(encrypted.length)/base2);
    bstring += toBin(pow, 5);
    bstring += toBin(encrypted.length, pow);

    // perform sanity check to ensure message can be encoded
    if (3*image.width*image.height < (5+pow+(7*encrypted.length)))
        return false

    // encode message to binary
    for (let i = 0; i < encrypted.length; i++){
        let val = encrypted.charCodeAt(i)-43;
        bstring += toBin(val, 7);
    }

    // write binary string to canvas
    let bits = bstring.split("");
    let [x, y] = [0, 0];
    while (bits.length > 0){
        let data = ctx.getImageData(x, y, image.width, image.height);
        let rgb = [data[0],data[1],data[2]];

        for (let i = 0; i < 3 && bits.length > 0; i++)
            if (rgb[i]%2!=bits.pop())
                if (rgb[i]==255)
                    rgb[i]--;
                else
                    rgb[i]++;

        ctx.fillStyle = "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
        ctx.fillRect( x, y, 1, 1 );

        x++;
        if (x > image.width-1){
            x = 0;
            y++;
        }
    }

    // TODO: create HTML response form
}