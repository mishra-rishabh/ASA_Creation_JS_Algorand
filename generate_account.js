const algosdk = require( "algosdk" ) ;

let account = algosdk.generateAccount() ;
let mnemonic = algosdk.secretKeyToMnemonic( account.sk ) ;

console.log( "Account address: " , account.addr ) ;
console.log( "Account mnemonic: " , mnemonic ) ;

