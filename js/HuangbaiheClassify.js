// Upsample MODIS landcover classification (250m) to Landsat
// resolution (30m) using a supervised classifier.
var collection = ee.ImageCollection("MODIS/006/MCD12Q1");
// var geometry = ee.Geometry.Polygon(
//         [[[29.972731783841393, 31.609824974226175],
//           [29.972731783841393, 30.110383818311096],
//           [32.56550522134139, 30.110383818311096],
//           [32.56550522134139, 31.609824974226175]]], null, false);

var HBH = ee.FeatureCollection("users/wufvckshuo/HuangBaiHe");
var roi = HBH;
Map.centerObject(roi, 7);
Map.setOptions("SATELLITE");
Map.addLayer(roi, {color: "00ff00"}, "roi", false);          

// Use the MCD12 land-cover as training data.

// See the collection docs to get details on classification system.
var modisLandcover = collection
    .filterDate('2001-01-01', '2001-12-31')
    .first()
    .select('LC_Type1')
    // Quick hack to get the labels to start at zero.
    .subtract(1);

// A pallete to use for visualizing landcover images.  You can get this
// from the properties of the collection.
var landcoverPalette = '05450a,086a10,54a708,78d203,009900,c6b044,dcd159,' +
    'dade48,fbff13,b6ff05,27ff87,c24f44,a5a5a5,ff6d4c,69fff8,f9ffa4,1c0dff';
// A set of visualization parameters using the landcover palette.
var landcoverVisualization = {palette: landcoverPalette, min: 0, max: 16, format: 'png'};
// Center over our region of interest.
// Map.centerObject(geometry, 11);
// Draw the MODIS landcover image.
Map.addLayer(modisLandcover.clip(roi), landcoverVisualization, 'MODIS landcover');

// Load and filter Landsat data.
var l7 = ee.ImageCollection('LANDSAT/LC08/C01/T1')
    .filterBounds(roi)
    .filterDate('2018-01-01', '2019-01-01');

print(l7)
// Draw the Landsat composite, visualizing true color bands.
var landsatComposite = ee.Algorithms.Landsat.simpleComposite({
  collection: l7,
  asFloat: true
});
Map.addLayer(landsatComposite, {min: 0, max: 0.3, bands: ['B3','B2','B1']}, 'Landsat composite');

// Make a training dataset by sampling the stacked images.
var training = modisLandcover.addBands(landsatComposite).sample({
  region: roi,
  scale: 30,
  numPixels: 1000
});

// Train a classifier using the training data.
var classifier = ee.Classifier.smileCart().train({
  features: training,
  classProperty: 'LC_Type1',
});

// Apply the classifier to the original composite.
var upsampled = landsatComposite.classify(classifier);



// Show the training area.
// Map.addLayer(geometry, {}, 'Training region', false);

// Draw the upsampled landcover image.
Map.addLayer(upsampled.clip(roi), landcoverVisualization, 'Upsampled landcover');

//非监督分类
var HBH = ee.FeatureCollection("users/wufvckshuo/HuangBaiHe");
var roi = /* color: #d63000 */ee.Geometry.Polygon(
        [[[114.02191591378232, 33.78358088957628],
          [114.03290224190732, 32.814844755032674],
          [115.04913759346982, 32.85638443066918],
          [115.01617860909482, 33.8018413803568]]]);
roi = HBH;
Map.centerObject(roi, 7);
Map.setOptions("SATELLITE");
Map.addLayer(roi, {color: "00ff00"}, "roi", false);

//Landsat8 SR数据去云
function rmCloud(image) {
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  var qa = image.select("pixel_qa");
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

//缩放
function scaleImage(image) {
  var time_start = image.get("system:time_start");
  image = image.multiply(0.0001);
  image = image.set("system:time_start", time_start);
  return image;
}

//添加NDVI
function NDVI(image) {
  return image.addBands(image.normalizedDifference(["B5", "B4"]).rename("NDVI"));
}

var l8Col = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR")
              .filterBounds(roi)
              .filterDate("2018-5-1", "2018-10-1")
              .filter(ee.Filter.lte("CLOUD_COVER", 50))
              .map(rmCloud)
              .map(scaleImage)
              .map(NDVI);
print("l8Col", l8Col);

var l8Image = l8Col.select(["B1", "B2", "B3", "B4", "B5", "B6", "B7", "NDVI"])
                   .median()
                   .clip(roi);
var visParam = {
  min: 0,
  max: 0.3,
  bands: ["B4", "B3", "B2"]
};
Map.addLayer(l8Image, visParam, "l8Image");

var sampleRoi = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[114.62959747314449, 33.357067677774594],
          [114.63097076416011, 33.32896028884253],
          [114.68315582275386, 33.33125510961763],
          [114.68178253173824, 33.359361757948754]]]);
Map.addLayer(sampleRoi, {color: "red"}, "sampleRoi", false);

//生成训练使用的样本数据
var training = l8Image.sample({
  region: roi,
  scale: 30,
  numPixels:5000
});

print("training", training.limit(1));

//初始化非监督分类器
var count = 5;
var clusterer = ee.Clusterer.wekaKMeans(count)
                  .train(training);
                  
//调用影像或者矢量集合中的cluster方法进行非监督分类
var result = l8Image.cluster(clusterer);
print("result", result);

Map.addLayer(result.randomVisualizer(), {}, "result");
