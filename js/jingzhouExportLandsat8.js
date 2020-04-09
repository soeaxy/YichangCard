var CN = ee.FeatureCollection("users/wufvckshuo/China_City");
var jingzhou = CN.filter(ee.Filter.eq('NAME', '荆州市'));
var yichang = CN.filter(ee.Filter.eq('NAME', '宜昌市')); 
roi = yichang;

Map.centerObject(roi, 7);
Map.setOptions("SATELLITE");
Map.addLayer(roi, {color: "00ff00"}, "roi");

//Landsat8 SR数据去云
function maskCloudsAndShadows(image) {
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

var l8Col = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR")
          .filterBounds(roi)
          .filterDate("2018-01-1", "2018-10-1")
          .filter(ee.Filter.lte("CLOUD_COVER", 50))
          .map(maskCloudsAndShadows)
          .map(scaleImage);
print("l8Col", l8Col);

var l8Image = l8Col.median().clip(roi);
var visParam = {
    min: 0,
    max: 0.3,
    bands: ["B4", "B3", "B2"]
};
Map.addLayer(l8Image, visParam, "l8Image");

image = l8Image.toFloat();
Export.image.toDrive({
            image: l8Image,
            description: 'jingzhou',
            folder:'jingzhou',
            region: roi.geometry(),
            scale: 30,
            crs: "EPSG:4326",
            maxPixels: 1e13
          });

