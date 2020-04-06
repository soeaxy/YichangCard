var lib = require("users/wangweihappy0/myTrainingShare:training03/pubLibs");
var roi = ee.FeatureCollection("users/wufvckshuo/XiangxihePolygon");
Map.centerObject(roi, 7);
Map.addLayer(ee.Image());
Map.addLayer(roi, {color:"red"}, "roi");

var yearImgs = [];
var years = [2011,2014,2017,2019];
yearImgs = years.map(function(y){
  
})
var image0 = ee.Image("users/wufvckshuo/XXH/xxhNDVI-2011");
var image1 = ee.Image("users/wufvckshuo/XXH/xxhNDVI-2014");
var image2 = ee.Image("users/wufvckshuo/XXH/xxhNDVI-2017");
var image3 = ee.Image("users/wufvckshuo/XXH/xxhNDVI-2019");
yearImgs = [image0,image1,image2,image3];

var yearCol = ee.ImageCollection.fromImages(yearImgs)
                .select("NDVI");
yearCol = yearCol.map(function(image) {
                  var dict = image.reduceRegion({
                    reducer: ee.Reducer.percentile([5, 95]),
                    geometry: roi.geometry().bounds(),
                    scale: 30,
                    maxPixels: 1e13,
                    tileScale: 16
                  });
                  var _p5 = ee.Number(dict.get("NDVI_p5"));
                  var _p95 = ee.Number(dict.get("NDVI_p95"));
                  var imgFVC = image.subtract(_p5).divide(_p95.subtract(_p5));
                  imgFVC = imgFVC.where(imgFVC.gte(1), 1);
                  imgFVC = imgFVC.where(imgFVC.lte(0), 0);
                  image = image.set("min", _p5);
                  image = image.set("max", _p95);
                  return image.addBands(imgFVC.rename("FVC")).select("FVC");
                });
var dateList = yearCol.reduceColumns(ee.Reducer.toList(), ["date"])
                      .get("list");
print("yearList", dateList);
dateList.evaluate(function(dates) {
  for (var i=0; i<dates.length; i++) {
    var image = yearCol.filter(ee.Filter.eq("date", dates[i])).first();
    Export.image.toAsset({
      image: image,
      description: "XXH-YearFVC-"+dates[i],
      assetId: "XXH/xxhFVC-"+dates[i],
      region: roi.geometry().bounds(),
      scale: 30, 
      maxPixels: 1e13
    });
  }
});

var visParam = {
  min: 0,
  max: 0.9,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};
Map.addLayer(yearCol.first(), visParam, "2011");
