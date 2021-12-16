require( "dotenv" ).config() ;
const algoSdk = require( "algosdk" ) ;
const config = require( "./config" ) ;
const pinataSDK = require( "@pinata/sdk" ) ;
const pinataApiKey = config.pinataApiKey ;
const pinataApiSecret = config.pinataApiSecret ;

const pinata = pinataSDK( pinataApiKey , pinataApiSecret ) ;
const filePath = "./assets/emblem.jpg" ;

const server = process.env.BASE_SERVER ;
const port = "" ;
const token = {
  "x-api-key": process.env.API_KEY
} ;

// function to generate cid of asset
const generateCID = async function( filePath ) {
  const options = {
    pinataMetadata: {
    name: "National Emblem",
    } ,

    pinataOptions: {
      cidVersion: 0
    }
  } ;
  const ipfsDetails = await pinata.pinFromFS( filePath , options )
  .then( ( result ) => {
    //handle results here
    // console.log( result ) ;
    console.log( "Successfully Pinned File to IPFS:", `https://ipfs.io/ipfs/${result.IpfsHash}` ) ;
    return result ;
  } ).catch( ( err ) => {
      //handle error here
      console.log( err ) ;
  } ) ;

  const url = `https://ipfs.io/ipfs/${ipfsDetails.IpfsHash}` ;
  console.log( "hello this url: " , ipfsDetails ) ;
  
  return url ;
} ;

// Function used to wait for a tx confirmation
const waitForConfirmation = async function( client , transactionId ) {
  let response = await client.status().do() ;
  let lastRound = response[ "last-round" ] ;

  while( true ) {
    const pendingInfo = await client.pendingTransactionInformation( transactionId ).do() ;

    if( pendingInfo[ "confirmed-round" ] !== null && pendingInfo[ "confirmed-round" ] > 0 ) {
      // got the completed transaction
      console.log( "Transaction: " + transactionId + " confirmed in round " + pendingInfo[ "confirmed-round" ] ) ;
      
      break ;
    }

    lastRound++ ;
    await client.statusAfterBlock( lastRound ).do() ;
  }
} ;

// Function used to print created asset for account and assetid
const printAssetCreated = async function( client , account , assetId ) {
  let accountInfo = await client.accountInformation( account ).do() ;

  for( i = 0 ; i < accountInfo[ "created-assets" ].length ; i++ ) {
    let scrutinizedAsset = accountInfo[ "created-assets" ][ i ] ;

    if( scrutinizedAsset[ "index" ] == assetId ) {
      console.log( "Asset id: " , scrutinizedAsset[ "index" ] ) ;

      let myParams = JSON.stringify( scrutinizedAsset[ "params" ] , undefined , 2 ) ;
      console.log( "params: " , myParams ) ;

      break ;
    }
  }
} ;

// Function used to print asset holding for account and assetid
const printAssetHolding = async function( client , account , assetId ) {
  let accountInfo = await client.accountInformation( account ).do() ;
  
  for( i = 0 ; i < accountInfo[ "assets" ].length ; i++ ) {
    let scrutinizedAsset = accountInfo[ "assets" ][ i ] ;

    if( scrutinizedAsset[ "asset-id" ] == assetId ) {
      let myAssetHolding = JSON.stringify( scrutinizedAsset , undefined , 2 ) ;
      console.log( "Asset holding info: " , myAssetHolding ) ;
      
      break ;
    }
  }
} ;

var mnemonic_acc1 = "account_1 generated mnemonic" ;
var mnemonic_acc2 = "account_2 generated mnemonic" ;
var mnemonic_acc3 = "account_3 generated mnemonic" ;

var account1 = algoSdk.mnemonicToSecretKey( mnemonic_acc1 ) ;
var account2 = algoSdk.mnemonicToSecretKey( mnemonic_acc2 ) ;
var account3 = algoSdk.mnemonicToSecretKey( mnemonic_acc3 ) ;

// Instantiate the algod wrapper
const client = new algoSdk.Algodv2( token , server , port ) ;

console.log( "Account 1: " , account1.addr ) ;
console.log( "Account 2: " , account2.addr ) ;
console.log( "Account 3: " , account3.addr ) ;

// create transaction
( async () => {
  let params = await client.getTransactionParams().do() ;

  params.fee = 1000 ;
  params.flatFee = true ;

  console.log( params ) ;

  // let note = algoSdk.encodeObj( "showing prefix" ) ;
  let note = undefined ;

  // Asset creation specific parameters
  // The following parameters are asset specific
  let addr = account1.addr ;

  // Whether user accounts will need to be unfrozen before transacting
  let defaultFrozen = false ;

  // integer number of decimals for asset unit calculation
  let decimals = 0 ;

  // total number of this asset available for circulation
  let totalIssuance = 1000 ;

  // Used to display asset units to user
  let unitName = "PENGUIN" ;

  // Friendly name of the asset
  let assetName = "penguin" ;

  // Optional string pointing to a URL relating to the asset
  let assetURL = await generateCID( filePath ) ;
  // let assetURL = "https://ipfs.io/ipfs/Qme5CQ3Gp7eXJT6d6wbg1jcuKQa1qWTNu3UUzUPc4sa3x7" ;

  // Optional hash commitment of some sort relating to the asset. 32 character length.
  let assetMetaDataHash = "" ;

  // The following parameters are the only ones
  // that can be changed, and they have to be changed
  // by the current manager
  // Specified address can change reserve, freeze, clawback, and manager
  let manager = account2.addr ;

  // Specified address is considered the asset reserve
  // (it has no special privileges, this is only informational)
  let reserve = account2.addr ;

  // Specified address can freeze or unfreeze user asset holdings 
  let freeze = account2.addr ;

  // Specified address can revoke user asset holdings and send 
  // them to other addresses 
  let clawBack = account2.addr ;

  // signing and sending "txn" allows "addr" to create an asset
  let transaction = algoSdk.makeAssetCreateTxnWithSuggestedParams(
    addr , note , totalIssuance , decimals , defaultFrozen , manager ,
    reserve , freeze , clawBack , unitName , assetName , assetURL , 
    assetMetaDataHash , params
  ) ;

  // sign the transaction
  let rawSignedTransaction = transaction.signTxn( account1.sk ) ;

  // Send Create ASA Transaction to the Blockchain and print the Tx ID
  let tx = ( await client.sendRawTransaction( rawSignedTransaction ).do() ) ;
  console.log( "Asset creation transaction: " , tx.txId ) ;

  let assetId = null ;

  // wait for transaction to be confirmed
  await waitForConfirmation( client , tx.txId ) ;

  // Get the new asset's information from the creator account
  let pendingTx = await client.pendingTransactionInformation( tx.txId ).do() ;
  assetId = pendingTx[ "asset-index" ] ;
  // console.log( "Asset id: " , assetId ) ;

  // // Get the new asset's information from the creator account
  // let ptx = await client.pendingTransactionInformation( tx.txId ).do() ;
  // assetId = ptx[ "asset-index" ] ;
  // // console.log( "Asset id: " , assetId ) ;

  await printAssetCreated( client , account1.addr , assetId ) ;
  await printAssetHolding( client , account1.addr , assetId ) ;

  // Change the manager using an asset configuration transaction
  // assetId = process.env.ASSET_ID_NEW ;

  params = await client.getTransactionParams().do() ;
  params.fee = 1000 ;
  params.flatFee = true ;

  manager = account1.addr ;

  let configTransaction = algoSdk.makeAssetConfigTxnWithSuggestedParams(
    account2.addr , note , assetId , manager , reserve , freeze ,
    clawBack , params 
  ) ;

  // sign the transaction
  // This transaction must be signed by the current manager
  rawSignedTransaction = configTransaction.signTxn( account2.sk ) ;

  // Send Transaction to the Network. Broadcast the transaction to the blockchain
  let ctx = ( await client.sendRawTransaction( rawSignedTransaction ).do() ) ;
  console.log( "Transaction: " , ctx.txId ) ;

  // wait for transaction to be confirmed
  await waitForConfirmation( client , ctx.txId ) ;

  // Opt-In Transaction
  params = await client.getTransactionParams().do() ;
  params.fee = 1000 ;
  params.flatFee = true ;

  let sender = account3.addr ;
  let recipient = sender ;

  // We set revocationTarget to undefined as 
  // This is not a clawback operation
  let revocationTarget = undefined ;

  // CloseReaminerTo is set to undefined as
  // we are not closing out an asset
  let closeRemainderTo = undefined ;

  // We are sending 0 assets
  amount = 0 ;

  // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
  let opttxn = algoSdk.makeAssetTransferTxnWithSuggestedParams(
    sender , recipient , closeRemainderTo , revocationTarget ,
    amount , note , assetId , params
  ) ;

  // Sign Transaction
  rawSignedTransaction = opttxn.signTxn( account3.sk ) ;

  // Send the Transaction to the network
  let opttx = ( await client.sendRawTransaction( rawSignedTransaction ).do() ) ;
  console.log( "Transaction: " , opttx.txId ) ;

  // wait for transaction to be confirmed
  await waitForConfirmation( client , opttx.txId ) ;

  //You should now see the new asset listed in the account information
  console.log( "Account 3: " , account3.addr ) ;

  // Print the account information for account 3
  await printAssetHolding( client , account3.addr , assetId ) ;

  // 4. Create Asset Transfer Transaction
  params = await client.getTransactionParams().do() ;
  params.fee = 1000 ;
  params.flatFee = true ;

  sender = account1.addr ;
  recipient = account3.addr ;

  revocationTarget = undefined ;
  closeRemainderTo = undefined ;
  
  //Amount of the asset to transfer
  amount = 10 ;

  // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
  let xtxn = algoSdk.makeAssetTransferTxnWithSuggestedParams(
    sender , recipient , closeRemainderTo , revocationTarget ,
    amount , note , assetId , params
  ) ;

  //  Sign Transfer Transaction. Must be signed by the account sending the asset
  rawSignedTransaction = xtxn.signTxn( account1.sk ) ; 

  // Send Transfer Transaction. Submit the transaction and list the account amount for acct3
  let xtx = ( await client.sendRawTransaction( rawSignedTransaction ).do() ) ;
  console.log( "Transaction: " , xtx.txId ) ;

  // wait for transaction to be confirmed
  await waitForConfirmation( client , xtx.txId ) ;

  // Print Account Information
  // You should now see the 10 assets listed in the account information
  console.log( "Account 3: " , account3.addr ) ;
  await printAssetHolding( client , account3.addr , assetId ) ;

  // 5. Create the Freeze Transaction
  params = await client.getTransactionParams().do() ;
  params.fee = 1000 ;
  params.flatFee = true ;

  from = account2.addr ;
  freezeTarget = account3.addr ;
  freezeState = true ;

  // The freeze transaction needs to be signed by the freeze account
  let ftxn = algoSdk.makeAssetFreezeTxnWithSuggestedParams(
    from , note , assetId , freezeTarget , freezeState , params
  ) ;

  // Sign Freeze Transaction. Must be signed by the freeze account
  rawSignedTransaction = ftxn.signTxn( account2.sk ) ;

  // Send Freeze Transaction. Broadcast the freeze transaction to the blockchain
  let ftx = ( await client.sendRawTransaction( rawSignedTransaction ).do() ) ;
  console.log( "Transaction: " , ftx.txId ) ;

  // wait for transaction to be confirmed
  await waitForConfirmation( client , ftx.txId ) ;

  // Print Account Information
  console.log( "Account 3: " , account3.addr ) ;
  await printAssetHolding( client , account3.addr , assetId ) ;

  // 6. Revoke Transaction
  params = await client.getTransactionParams().do() ;
  params.fee = 1000 ;
  params.flatFee = true ;

  sender = account2.addr ;
  recipient = account1.addr ;
  revocationTarget = account3.addr ;
  closeRemainderTo = undefined ;
  amount = 10 ;

  // signing and sending "txn" will send "amount" assets from "revocationTarget" to "recipient",
  // if and only if sender == clawback manager for this asset
  let rtxn = algoSdk.makeAssetTransferTxnWithSuggestedParams(
    sender , recipient , closeRemainderTo , revocationTarget ,
    amount , note , assetId , params
  ) ;

  // Sign Revoke Asset Transaction
  // Must be signed by the account that is the clawback address
  rawSignedTransaction = rtxn.signTxn( account2.sk ) ;

  // Send Revoke Asset Transaction. Broadcast the transaction to the blockchain
  rawSignedTransaction = rtxn.signTxn( account2.sk ) ;
  let rtx = ( await client.sendRawTransaction( rawSignedTransaction ).do() ) ;
  console.log( "Transaction: " , rtx.txId ) ;

  // wait for transaction to be confirmed
  await waitForConfirmation( client , rtx.txId ) ;

  // Print Account Information
  console.log( "Account 3: " , account3.addr ) ;
  await printAssetHolding( client , account3.addr , assetId ) ;

/*
  // 7. Destroy Asset
  params = await client.getTransactionParams().do() ;
  params.fee = 1000 ;
  params.flatFee = true ;

  // The address for the from field must be the manager account
  // Which is currently the creator addr1
  addr = account1.addr ;
  note = undefined ;

  // if all assets are held by the asset creator,
  // the asset creator can sign and issue "txn" to remove the asset from the ledger. 
  let dtxn = algoSdk.makeAssetDestroyTxnWithSuggestedParams(
    addr , note , assetId , params
  ) ;

  // Sign Destroy Asset Transaction
  // The transaction must be signed by the manager which 
  // is currently set to account1
  rawSignedTransaction = dtxn.signTxn( account1.sk ) ;

  // Send Destroy Asset Transaction
  let dtx = ( await client.sendRawTransaction( rawSignedTransaction ).do() ) ;
  console.log( "Transaction: " , dtx.txId ) ;

  // wait for the transaction to be confirmed
  await waitForConfirmation( client , dtx.txId ) ;
*/

  // Print Account Information
  // Account 3 and Account 1 should no longer contain the asset as it has been destroyed.
  console.log( "Asset id: " , assetId ) ;
  console.log( "Account 1: " , account1.addr ) ;
  await printAssetCreated( client , account1.addr, assetId ) ;
  await printAssetHolding( client , account1.addr , assetId ) ;

  console.log( "Account 3: " , account3.addr ) ;
  await printAssetHolding( client , account3.addr , assetId ) ;

  // Get the asset information for the newly changed asset
  // The manager should now be the same as the creator
  // await printAssetCreated( client , account1.addr, assetId ) ;
} )
().catch( e => {
  console.log( e ) ;
  console.trace() ;
} ) ;

