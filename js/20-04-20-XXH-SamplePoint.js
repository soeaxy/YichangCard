var imageCollection = ee.ImageCollection("MODIS/051/MCD12Q1"),
    roi = ee.FeatureCollection("users/wufvckshuo/yichang/YC");
// Force projection of 500 meters/pixel, which is the native MODIS resolution.
var SCALE = 500;
//Define boundary
var boundary = ee.FeatureCollection(roi).geometry();
//Reclass MODIS Land cover
var image1 = ee.Image('MODIS/051/MCD12Q1/2010_01_01')
               .select(['Land_Cover_Type_1'])
               .clip(roi)
               .reduceResolution({reducer: ee.Reducer.mode(), maxPixels: 1024})
               .reproject('EPSG:4326', null, 30)
               .remap([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],[5,0,0,0,0,0,2,2,1,1,1,6,3,4,3,7,8,8]);
//add Lon % Lat bands
var image2 = image1.addBands(ee.Image.pixelLonLat().reproject(image1.projection()));
print(image2);
//Randomly generate sample points
var points = image2.stratifiedSample({
  numPoints:10000,
  classBand:'remapped',
  region: boundary,
  seed: 2, 
  dropNulls: true, 
  });
// add Lon % Lat to get points geometry
 points = points.map(function(point){
  var long = point.get("longitude");
  var lat = point.get("latitude");
  var geom = ee.Algorithms.GeometryConstructors.Point([long, lat]);
  return point.setGeometry(geom);
});
// print(points);
Map.centerObject(points)
Map.addLayer(points, {color: "000000"}, "points");
Export.table.toDrive({
  collection: points,
  description:'points_8000',
  fileFormat: 'shp',
});
