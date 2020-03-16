# -*- coding: utf-8 -*-
import arcpy

def ExportToJPGFile(mxd, df, lyr,fidIdx, outputDir, filename, imgWidth=600,imgHeight=500):
    query = "FID={0}".format(fidIdx)
    arcpy.SelectLayerByAttribute_management(lyr, "NEW_SELECTION", query)

    # 缩放到所选要素，再将比例尺缩小2倍
    df.zoomToSelectedFeatures()
    df.scale = df.scale*1.6
    # df.panToExtent(lyr.getSelectedExtent())

    outFile = "{0}\\{1}.jpg".format(outputDir, filename)
    arcpy.mapping.ExportToJPEG(mxd, outFile, df, imgWidth, imgHeight, 72)
    return outFile

if __name__=="__main__":
    input_mxd = r"HeNanHuBei\HeNanMiningCard.mxd"
    output_imageDir = r"HeNanHuBei"

    mxd = arcpy.mapping.MapDocument(input_mxd)
    lyr = arcpy.mapping.ListLayers(mxd)[0]
    df = arcpy.mapping.ListDataFrames(mxd)[0]
    rows = arcpy.SearchCursor(lyr)
    ii = 0
    for row in rows:
        if ii < 100:
            filename = row.getValue(u"解译编号")
            ExportToJPGFile(mxd, df, lyr, ii, output_imageDir, filename)
        ii = ii + 1
    arcpy.RefreshActiveView()
    arcpy.RefreshTOC()
    del mxd
