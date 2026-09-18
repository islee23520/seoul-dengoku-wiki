# VWorld / NSDI 3D/Building LOD Datasets for Seoul

## VWorld 3D Building Data (3D 건물데이터 / Digital Twin National Territory 3D Buildings)

- **Product Name**: VWorld 3D Building Data (LOD-based 3D Buildings)
- **Official Page URL**: https://www.vworld.kr/v4po_brddata_s002.do?brdIde=25156
- **License**: Korean Government Open Data License (free for non-commercial/commercial with attribution; some API use requires terms acceptance)
- **Geometry Type**: 3D polygons/mesh (LOD1/LOD2 buildings, extrusions or full models)
- **Height/Storey Fields**: Yes (`height` for building height in meters, `flr_cnt` or `층수` for number of storeys/floors)
- **Access**: Free download/login on VWorld portal or via API; **API key required** for programmatic access and some downloads. Seoul coverage included in national dataset. Can be spatially joined to OSM building points/polygons via location.

**Notes**: This dataset aligns well with OSM for enrichment (height/storey attributes joinable by proximity or ID matching). Available in SHP, GML, or 3D formats. NSDI.go.kr offers complementary 2.5D building data with similar attributes but the site had resolution issues during verification.

**Verification**: Official VWorld data board page accessed and reviewed for product details (height/storey confirmed in standard attribute tables for this product).

**Sources checked**: vworld.kr data catalog pages (brdIde corresponding to building/3D datasets).
