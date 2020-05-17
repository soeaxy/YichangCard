// https://code.earthengine.google.com/d7a76c30ac3d177a393a9faf9514f8a0
var table = ee.FeatureCollection("users/547695554/Boundary/Boundary_CAisa_Xinjiang"),
    geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[45.8349609375, 47.18971246448421],
          [48.02601420967471, 45.98523091373423],
          [48.1201171875, 43.29320031385282],
          [53.497152580874854, 37.52560452301072],
          [56.839908764911, 36.26135016225269],
          [60.1171875, 34.45221847282654],
          [74.267578125, 35.17380831799959],
          [79.00513112867657, 34.09972926515507],
          [85.4841216626744, 34.93614070668937],
          [92.8125, 35.31736632923788],
          [96.1083984375, 39.60568817832083],
          [96.74560546875, 44.024421519659334],
          [88.505859375, 50.3454604086048],
          [83.759765625, 51.508742458803326],
          [79.8046875, 53.54030739150022],
          [74.970703125, 55.27911529201562],
          [69.697265625, 55.62799595426723],
          [63.544921875, 54.87660665410869],
          [52.20703125, 53.01478324585924],
          [45.791015625, 49.894634395734215]]]),
    table2 = ee.FeatureCollection("users/547695554/Sample_Points_Folder/Sample_Points");
/*******************************
USER DEFINITIONS
********************************/
//define boundary and Train points
var boundary = ee.FeatureCollection(table);
var points = ee.FeatureCollection(table2);
/*******************************
Image pre-processing
********************************/
// This function masks clouds in Landsat 8 imagery.
var maskClouds = function(image) {
  var scored = ee.Algorithms.Landsat.simpleCloudScore(image);
  return image.updateMask(scored.select(['cloud']).lt(40));
};
//Add bands_NDVI, NDWI, SRTM and Lights
var SRTM = ee.Image("USGS/SRTMGL1_003").clip(boundary);
var light = ee.Image("NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG/20171201")
              .clip(boundary)
              .reduceResolution({reducer: ee.Reducer.mode(), maxPixels: 1024})
              .reproject('EPSG:4326', null, 30);
var addQualityBands = function(image) {
  return maskClouds(image)
    // NDVI
    .addBands(image.normalizedDifference(['B4', 'B3']))
    //NDWI
    .addBands(image.normalizedDifference(['B2','B4']))
    // time in days
    .addBands(image.metadata('system:time_start'))
    //dem
    .addBands(SRTM).addBands(light);
};
//define bands
var bands=  ['B1','B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8','B9','B10', 'B11','nd','nd_1','elevation','avg_rad'];
//import imagery
var collection2016 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
          .filterBounds(table)
          .filterDate('2016-04-01', '2016-07-30')
          .map(addQualityBands);
//print(collection2016)
var collection2017 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
          .filterBounds(table)
          .filterDate('2017-04-01', '2017-07-30')
          .map(addQualityBands);
var collection2018 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
          .filterBounds(table)
          .filterDate('2018-04-01', '2018-07-30')
          .map(addQualityBands);          
//composite image
var collection2017 = collection2017.merge(collection2016).merge(collection2018); 
var image2017 = collection2017.select(bands).median();
/*******************************
Classification
********************************/
// Overlay the points on the imagery to get training.
var training17 = image2017.sampleRegions({
  collection: points,
  properties: ['class'],
  scale: 30
});
var trainingData_test = training17.randomColumn('random');
var training2017 = trainingData_test.filterMetadata('random', 'less_than', 0.8);
var validation2017 = trainingData_test.filterMetadata('random', 'not_less_than', 0.8);
// Train a RF classifier with default parameters.
var trained2017 = ee.Classifier.randomForest(500).train(training2017, 'class', bands);
// Classify the image with the same bands used for training.
var classified2017 = image2017.select(bands).classify(trained2017);
print(classified2017)
Export.image.toDrive({
  image: classified2017,
  description: 'export2017',
  scale: 300,
  region:geometry,
  maxPixels:1e11
});
/*******************************
Accuracy assessment
********************************/
var validation = validation2017.classify(trained2017);
var errorMatrix2017 = validation.errorMatrix('class', 'classification');
var acc = ee.FeatureCollection([
  ee.Feature(null, { // feature as dictionary and without geometry
    "array": errorMatrix2017.array(),
    "Validation overall accuracy": errorMatrix2017.accuracy(),
    "Consumers Accuracy": errorMatrix2017.consumersAccuracy(),
    "Producers Accuracy": errorMatrix2017.producersAccuracy(),
    "Kappa coefficient": errorMatrix2017.kappa(),
  })
]);
Export.table.toDrive({
  collection: acc,
  description: "AccuracyS1",
  folder: "GEE",
  fileNamePrefix: "Accuracy2017",
  fileFormat: "CSV"});
