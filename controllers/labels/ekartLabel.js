module.exports = async function ekartLabel(shipment){

const awb = shipment.waybill;

const labelUrl = `https://ekart-api.com/label/${awb}`;

return {

courier:"Ekart",

awb,

labelUrl

};

}