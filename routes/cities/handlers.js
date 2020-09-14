import City from '../../models/City';
import Place from '../../models/Place';

export const getCity = async (req, res) => {
  const { id } = req.params;

  try {
    const city = await City.findById(id);

    if (!city) {
      res.status(404).json({ message: 'City not found.' });
      return;
    }

    const places = await Place.find({ cityID: id });
    city.places = places;

    res.json(city);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
};

export const getCities = async (req, res) => {
  try {
    const cities = await City.find({}, { __v: 0 });

    res.json({ cities });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
};
