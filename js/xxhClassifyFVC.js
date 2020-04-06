var roi = ee.FeatureCollection("users/wufvckshuo/XiangxihePolygon");
var yearList = [2011,2014,2017,2019];

var selectByYear = function(year){
  var imgFVC = ee.Image("users/wufvckshuo/XXH/xxhFVC-"+year);
  var imgNDVI = ee.Image("users/wufvckshuo/XXH/xxhNDVI-"+year);
  var image = imgNDVI.addBands(imgFVC);
  return image;
};
var imgList=ee.ImageCollection.fromImages(yearList.map(selectByYear));
print(imgList);

var reclassFVC = function(image){
    var reclassedFVC = image.select('FVC').gt(0.3).add(image.gt(0.45)).add(image.gt(0.6)).add(image.gt(0.75));
    return reclassedFVC;
};

var ClassifiedFVCCol = imgList.map(reclassFVC);
print(ClassifiedFVCCol);
Map.addLayer(ClassifiedFVCCol.first().select('FVC').randomVisualizer(),{},'image');
var region = roi.geometry();

function cacluateArea(image) {
  var totalArea = region.area().divide(1000000);
  print("total area (km^2)", totalArea);
  var tempImg = image.clip(region);
  var area1 = tempImg.eq(0);
  var area2 = tempImg.eq(1);
  var area3 = tempImg.eq(2);
  var area4 = tempImg.eq(3);
  var area5 = tempImg.eq(4);
  area1 = area1.updateMask(area1);
  area2 = area2.updateMask(area2);
  area3 = area3.updateMask(area3);
  area4 = area4.updateMask(area4);
  area5 = area5.updateMask(area5);

  var deDict1 = area1.multiply(ee.Image.pixelArea())
                      .reduceRegion({
                        reducer  : ee.Reducer.sum(),
                        geometry : region,
                        scale    : 30,
                        maxPixels: 1e13,
                        tileScale: 16
                      });
  var deDict3 = area3.multiply(ee.Image.pixelArea())
                    .reduceRegion({
                    reducer  : ee.Reducer.sum(),
                    geometry : region,
                    scale    : 30,
                    maxPixels: 1e13,
                    tileScale: 16
                    });

  var deDict2 = area2.multiply(ee.Image.pixelArea())
                    .reduceRegion({
                      reducer  : ee.Reducer.sum(),
                      geometry : region,
                      scale    : 30,
                      maxPixels: 1e13,
                      tileScale: 16
                    });
  var deDict4 = area4.multiply(ee.Image.pixelArea())
                  .reduceRegion({
                  reducer  : ee.Reducer.sum(),
                  geometry : region,
                  scale    : 30,
                  maxPixels: 1e13,
                  tileScale: 16
                  });
  var deDict5 = area5.multiply(ee.Image.pixelArea())
                    .reduceRegion({
                    reducer  : ee.Reducer.sum(),
                    geometry : region,
                    scale    : 30,
                    maxPixels: 1e13,
                    tileScale: 16
                    });                      
  var areaEq1 = ee.Number(deDict1.get("FVC")).divide(1000000);
  var areaEq2 = ee.Number(deDict2.get("FVC")).divide(1000000);
  var areaEq3 = ee.Number(deDict3.get("FVC")).divide(1000000);
  var areaEq4 = ee.Number(deDict4.get("FVC")).divide(1000000);
  var areaEq5 = ee.Number(deDict5.get("FVC")).divide(1000000);

  print("< 30 area (km^2) and percent (%)", areaEq1, areaEq1.divide(totalArea).multiply(100));
  print("30-45 area (km^2) and percent (%)", areaEq2, areaEq2.divide(totalArea).multiply(100));
  print("45-60 area (km^2) and percent (%)", areaEq3, areaEq3.divide(totalArea).multiply(100));
  print("60-75 area (km^2) and percent (%)", areaEq4, areaEq4.divide(totalArea).multiply(100));
  print("> 75 area (km^2) and percent (%)", areaEq5, areaEq5.divide(totalArea).multiply(100));

}

var count = ClassifiedFVCCol.size(); 
var imgs = ClassifiedFVCCol.toList(4);

ee.List.sequence(0,ee.Number(count.subtract(1))).getInfo()
.map(function(img){
  var image = ee.Image(imgs.get(img));
  print(image);
  cacluateArea(image.select('FVC'));
});

Map.addLayer(roi);
Map.centerObject(roi,8);

