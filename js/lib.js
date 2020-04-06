/**
 * 公共库类
 * 
 */
var l8_sr = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR");
var l7_sr = ee.ImageCollection("LANDSAT/LE07/C01/T1_SR");
var l5_sr = ee.ImageCollection("LANDSAT/LT05/C01/T1_SR");
var l4_sr = ee.ImageCollection("LANDSAT/LT04/C01/T1_SR");

var l457BandNames = ["B1","B2","B3","B4","B5","B7"];
var l8BandNames = ["B2","B3","B4","B5","B6","B7"];
var bandNames = ['blue','green','red','nir','swir1','swir2'];

//landsant457
var Landsat457 = {
  scaleImage: function(image) {
    var time_start = image.get("system:time_start");
    image = image.multiply(0.0001);
    image = image.set("system:time_start", time_start);
    return image;
  },
  
  //SR data remove cloud
  srCloudMask: function(image) {
    var qa = image.select('pixel_qa');
    var cloudShadowBitMask = 1 << 3;
    var cloudsBitMask = 1 << 5;
    var snowBitMask = 1 << 4;
    var mask = qa.bitwiseAnd(cloudsBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudShadowBitMask).eq(0))
                 .and(qa.bitwiseAnd(snowBitMask).eq(0));
    return image.updateMask(mask);
  },
  
  //NDVI: (N - R)/(N + R)
  NDVI: function(image) {
    return image.addBands(image.normalizedDifference(["nir", "red"])
                               .rename("NDVI"));
  },
  
  getL4SRCollection : function(startDate, endDate, roi) {
    var dataset = l4_sr.filterDate(startDate, endDate)
                       .filterBounds(roi)
                       .map(Landsat457.srCloudMask)
                       .select(l457BandNames, bandNames)
                       .map(Landsat457.scaleImage)
                       .map(Landsat457.NDVI);
    return dataset;
  },
  
  getL5SRCollection : function(startDate, endDate, roi) {
    var dataset = l5_sr.filterDate(startDate, endDate)
                       .filterBounds(roi)
                       .map(Landsat457.srCloudMask)
                       .select(l457BandNames, bandNames)
                       .map(Landsat457.scaleImage)
                       .map(Landsat457.NDVI);
    return dataset;
  },
  
  getL7SRCollection : function(startDate, endDate, roi) {
    var dataset = l7_sr.filterDate(startDate, endDate)
                       .filterBounds(roi)
                       .map(Landsat457.srCloudMask)
                       .select(l457BandNames, bandNames)
                       .map(Landsat457.scaleImage)
                       .map(Landsat457.NDVI);
    return dataset;
  }
};

//landsant8
var Landsat8 = {
  scaleImage: function(image) {
    var time_start = image.get("system:time_start");
    image = image.multiply(0.0001);
    image = image.set("system:time_start", time_start);
    return image;
  },
  
  //SR data remove cloud
  srCloudMask: function(image) {
    var cloudShadowBitMask = 1 << 3;
    var cloudsBitMask = 1 << 5;
    var snowBitMask = 1 << 4;
    var qa = image.select('pixel_qa');
    var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0))
                 .and(qa.bitwiseAnd(snowBitMask).eq(0));
    return image.updateMask(mask);
  },
  
  //NDVI: (N - R)/(N + R)
  NDVI: function(image) {
    return image.addBands(image.normalizedDifference(["nir", "red"])
                               .rename("NDVI"));
  },
  
  getL8SRCollection : function(startDate, endDate, roi, rmSnow) {
    var dataset = l8_sr.filterDate(startDate, endDate)
                       .filterBounds(roi)
                       .map(Landsat8.srCloudMask)
                       .select(l8BandNames, bandNames)
                       .map(Landsat8.scaleImage)
                       .map(Landsat8.NDVI);                   
    return dataset;
  }
};

exports.getL4SRCollection = function(startDate, endDate, roi) {
  return Landsat457.getL4SRCollection(startDate, endDate, roi);
};

exports.getL5SRCollection = function(startDate, endDate, roi) {
  return Landsat457.getL5SRCollection(startDate, endDate, roi);
};

exports.getL7SRCollection = function(startDate, endDate, roi) {
  return Landsat457.getL7SRCollection(startDate, endDate, roi);
};

exports.getL8SRCollection = function(startDate, endDate, roi) {
  return Landsat8.getL8SRCollection(startDate, endDate, roi);
};
