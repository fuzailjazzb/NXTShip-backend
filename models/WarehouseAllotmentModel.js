const mongoose = require("mongoose");

const warehouseAllotmentSchema = new mongoose.Schema({
  userId: String,

  defaultWarehouseId: String,

  autoWarehouse: {
    type: Boolean,
    default: false
  },

  storeMapping: [
    {
      storeName: String,
      warehouseId: String
    }
  ]
});

module.exports = mongoose.model("WarehouseAllotment", warehouseAllotmentSchema);