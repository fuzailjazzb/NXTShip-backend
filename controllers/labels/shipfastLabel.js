module.exports = async function shipfastLabel(shipment){

const awb = shipment.waybill;

return {

courier:"Shipfast",

awb,

labelUrl:null

};

}