import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

export default function MapTest() {
    return (
        <MapView
            provider={PROVIDER_GOOGLE}
            initialRegion={{
                latitude: -21.9694,
                longitude: -45.3486,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            style={{ width: "100%", height: "100%" }}
        >
            <Marker
                coordinate={{
                    latitude: -21.9694,
                    longitude: -45.3486,
                }}
                title="Agropet Lambari"
                description="R. José Capistrano, 640 - Lambari, MG"
            />
        </MapView>
    );
}