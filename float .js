function bin (whole) {
    let ceil = whole.toString(2);
    return ceil;
}
function reverb(num) {
    let si;
    if (num<0){
        si=1;
    }
    else si=0;
    if (num >((2-Math.pow(2,-23))*Math.pow(2,127)) || num == Infinity) {
        return("01111111100000000000000000000000");
    }
    else if (num < -((2-Math.pow(2,-23))*Math.pow(2,127)) || num == -Infinity) {
        return("11111111100000000000000000000000");
    }
    else if (isNaN(num)) {
        return("11111111110000000000000000000000");
    }
    num = Math.abs(num)
    let whole = Math.floor(num);
    let temp;

    if (whole != num) temp = Number('0.' + String(num).split('.')[1]);
    else temp=0;
    let wbin = bin(whole);
    let lenwbin = wbin.length;
    order = (lenwbin > 0) ? lenwbin - 1 : (-1);
    let tempbin = bintemp(temp, lenwbin)
    let binorder = bin(order + 127);
    let float = f(si, binorder, wbin, tempbin)

    orders.push(order);
    return float;
}
function bintemp (temp, lenwbin) {
    let flag;
    let tempbin = '';
    if (lenwbin>0) flag=true;
    else flag=false;
    if (temp) {
        for (let i = 0; i < 24-lenwbin; i++) {
            if (Math.floor(temp*2) == 1) flag = true;
            if (flag == false) {
                i--;
                order--;
            }
            else {
                tempbin += Math.floor(temp*2);
            }
            temp = Number('0.' + String(temp*2).split('.')[1]);
            if (isNaN(temp))
                break;
        }
    }
    else tempbin = '0'.repeat(24-lenwbin)
    tempbin += '0'.repeat(24 - lenwbin - tempbin.length)
    return tempbin;
}

function f(si, orderBin,  wbin, tempbin) {
    let float = si;
    float += '0'.repeat(8 - orderBin.length) + orderBin;
    if (wbin > 0) {
        float += wbin.slice(1, wbin.length) + tempbin;
    } else {
        float += tempbin.slice(1, tempbin.length);
    }
    return float;
}

function f2(orderBin) {
    let order = 0;
    let second = 1;
    for (let i = orderBin.length - 1; i >= 0; i--) {
        order += Number(orderBin[i]) * second;
        second *= 2;
    }
    return order -= 127;
}


function float(conversion) {
    let binmantis = conversion.slice(9, 32);
    let mantis = 0;
    let orderBin = conversion.slice(1, 9);
    let si = conversion[0];
    let order = f2(orderBin);
    let second = 0.5;
    for (let i = 0; i < binmantis.length; i++) {
        mantis += Number(binmantis[i]) * second;
        second *= 0.5
    }

    let dec = (1 + mantis) * Math.pow(2, order) * Math.pow((-1), si);
    return dec;
}

function noeq(first, second) {
    let diff = orders[0] - orders[1];
    second = first.slice(0,9) + '0'.repeat(diff - 1) + '1' + second.slice(9, 32 - diff);
    return second;
}

function add(first, second) {
    let gain = 1;
    let summa = '';
    let tr = 30;
    if (first.slice(1,9) != second.slice(1,9)) {
        tr = 31;
        gain = 0;
        second = noeq(first, second);
    }

    let dop = 0;
    for (let i = tr; i >= tr - 22; i--) {
        let amount = Number(first[i]) + Number(second[i]);
        summa = String((amount + dop) % 2) + summa;
        dop = Math.floor((amount + dop) / 2);
    }
    if (dop >= 1) {
        if (gain == 1);
        else summa = '0' + summa.slice(0, 22);
        gain++;
    }

    if (gain >= 1) {
        return first[0] + bin(f2(first.slice(1, 9))+128) + summa;
    }
    return first.slice(0,9) + summa;
}

function sub(first, second) {
    let gain = -1;
    let diff = '';
    if (first.slice(1,9) != second.slice(1,9)) {
        second = noeq(first, second);
        let flag = true;
        gain = 0;
    }

    let dop = 0;
    for (let i = 31; i >= 9; i--) {
        let amount = Number(first[i]) - Number(second[i]);
        diff = String((Math.abs(amount - dop)) % 2) + diff;
        dop = ((amount + dop) >= 0) ? 0 : -1;
    }

    if (gain == -1 || (gain == 0 && dop == -1)) {
        let i;
        for (i = 0; diff[i] == '0'; i++) {
            gain--;
        }
        if (dop == -1) {
            i++;
            gain--;
        }
        if (orders[0] == orders[1]) {
            i++;
        }
        diff = diff.slice(i, 31) + '0'.repeat(i);

    }
    let ordtemp = bin(f2(first.slice(1, 9)) +  127 + gain);
    let si = (string[0] > string[2]) ? '0' : '1';
    return si + '0'.repeat(8 - ordtemp.length) + ordtemp + diff;
}
let result = '';
let arg=process.argv;
let fs = require('fs')
let data = fs.readFileSync(arg[2],"utf8")
let string = data.split(' ');
let order;
let orders = [];
let frac=[];
if (arg[3]=="calc") {
    if (string[1] == '-') {
        string[2] *= -1;
    }
    if (Math.abs(string[0]) < Math.abs(string[2])) {
        [string[0], string[2]] = [string[2], string[0]];
        if (string[2] > 0 && string[1] == '-') {
            string[1] = '+';
        }
    }
    let first = reverb(Number(string[0]));
    string[0] = String(string[0]);
    let second = reverb(Number(string[2]));
    let answer;
    if ((string[0][0] == string[1]) || (string[1] == '+' && string[0][0] != '-' && string[2][0] != '-')) {
        answer = add(first, second);
        result += answer + '\n';
    }
    else {
            answer = sub(first, second);
            result += answer + '\n';
        }
    result += String(float(answer));
    console.log(result)
}
else if(arg[3]=="conv"){
    let result = reverb(Number(string));
    console.log(result);
}
//-5 + 1
//5.3 + 1.2 6.499999523162842
//340282360000000000000000000000000000000 01111111100000000000000000000000
//10 негритят 11111111110000000000000000000000
//-10.3 + 8.54 -1.7599992752075195
//0= 0011111110000000000000000000000
