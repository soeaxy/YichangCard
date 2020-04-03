
var CN = ee.FeatureCollection("users/wufvckshuo/China_City");
var jingzhou = CN.filter(ee.Filter.eq('NAME', '荆州市'));
var lct = require('users/google/toolkits:landcover/api.js');
var roi = jingzhou;
// Create a new dataset, filter by date, country, and mask clouds and shadows.
var dataset = lct.Landsat8()
                  .filterDate('2018-01-01', '2019-01-01')
                  .filterBounds(roi)
                  .maskCloudsAndShadows();

function scaleImage(image) {
    var time_start = image.get("system:time_start");
    image = image.multiply(0.0001);
    image = image.set("system:time_start", time_start);
    return image;
}

// Add the resulting ImageCollection to the map, taking the median of
// overlapping pixel values.
var image = (dataset.getImageCollection()).map(scaleImage).median().clip(roi).toFloat();
Map.addLayer(
    image, dataset.getDefaultVisParams());
Map.centerObject(roi);


Export.image.toDrive({
            image: image,
            description: 'jingzhou',
            folder:'jingzhou',
            region: roi.geometry(),
            scale: 30,
            crs: "EPSG:4326",
            maxPixels: 1e13
          });