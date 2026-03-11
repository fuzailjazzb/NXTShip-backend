module.exports = async function delhiveryLabel(shipment){

const awb = shipment.waybill;

const labelUrl = `https://track.delhivery.com/api/p/packing_slip?wbns=${awb}`;

return {

courier:"Delhivery",

awb,

labelUrl

};

}