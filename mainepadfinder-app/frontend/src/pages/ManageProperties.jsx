import { useEffect, useState } from "react";

export default function ManageProperties() {
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingProperty, setEditingProperty] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadProperties = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://localhost:5000/api/manage-properties", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load properties");
        setProperties([]);
      } else {
        setProperties(data);
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);


  const toggleAvailability = async (property) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/manage-properties/${property.PROPERTY_ID}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canRent: !property.CAN_RENT }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update property");
        return;
      }


      setProperties((prev) =>
        prev.map((p) =>
          p.PROPERTY_ID === property.PROPERTY_ID
            ? { ...p, CAN_RENT: property.CAN_RENT ? 0 : 1 }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  // edit
  const startEdit = (property) => {
    setEditingProperty({
      PROPERTY_ID: property.PROPERTY_ID,
      UNIT_LABEL: property.UNIT_LABEL || "",
      RENT_COST: property.RENT_COST,
      BEDROOMS: property.BEDROOMS,
      BATHROOMS: property.BATHROOMS,
      SQFT: property.SQFT,
      CAN_RENT: !!property.CAN_RENT,
    });
  };

  const cancelEdit = () => {
    setEditingProperty(null);
  };


  const saveEdit = async () => {
    if (!editingProperty) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:5000/api/manage-properties/${editingProperty.PROPERTY_ID}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitLabel: editingProperty.UNIT_LABEL,
            rentCost: Number(editingProperty.RENT_COST),
            bedrooms: Number(editingProperty.BEDROOMS),
            bathrooms: Number(editingProperty.BATHROOMS),
            sqft: Number(editingProperty.SQFT),
            canRent: editingProperty.CAN_RENT,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update property");
        return;
      }


      setProperties((prev) =>
        prev.map((p) =>
          p.PROPERTY_ID === editingProperty.PROPERTY_ID
            ? {
                ...p,
                UNIT_LABEL: editingProperty.UNIT_LABEL,
                RENT_COST: editingProperty.RENT_COST,
                BEDROOMS: editingProperty.BEDROOMS,
                BATHROOMS: editingProperty.BATHROOMS,
                SQFT: editingProperty.SQFT,
                CAN_RENT: editingProperty.CAN_RENT ? 1 : 0,
              }
            : p
        )
      );

      setEditingProperty(null);
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  // delete
  const deleteProperty = async (propertyId) => {
    const ok = window.confirm("Are you sure you want to delete this property?");
    if (!ok) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/manage-properties/${propertyId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      let data = null;
      try {
        data = await res.json();
      } catch (_) {

      }

      if (!res.ok) {
        alert((data && data.error) || "Failed to delete property");
        return;
      }


      setProperties((prev) =>
        prev.filter((p) => p.PROPERTY_ID !== propertyId)
      );


      if (editingProperty && editingProperty.PROPERTY_ID === propertyId) {
        setEditingProperty(null);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  if (loading) {
    return <div>Loading properties...</div>;
  }

  return (
    <div>
      <h1>Manage Properties</h1>

      {error && <p>{error}</p>}

      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Address</th>
                <th>Rent</th>
                <th>Beds</th>
                <th>Baths</th>
                <th>Sqft</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.PROPERTY_ID}>
                  <td>{p.PROPERTY_ID}</td>
                  <td>
                    {p.UNIT_LABEL ? p.UNIT_LABEL + ", " : ""}
                    {p.STREET}, {p.CITY}, {p.STATE_CODE} {p.ZIPCODE}
                  </td>
                  <td>{p.RENT_COST}</td>
                  <td>{p.BEDROOMS}</td>
                  <td>{p.BATHROOMS}</td>
                  <td>{p.SQFT}</td>
                  <td>{p.CAN_RENT ? "Yes" : "No"}</td>
                  <td>
                    <button onClick={() => toggleAvailability(p)}>
                      {p.CAN_RENT ? "Set Unavailable" : "Set Available"}
                    </button>{" "}
                    <button onClick={() => startEdit(p)}>Edit</button>{" "}
                    <button onClick={() => deleteProperty(p.PROPERTY_ID)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


          {editingProperty && (
            <div style={{ marginTop: "20px", borderTop: "1px solid #ccc", paddingTop: "10px" }}>
              <h2>Edit Property #{editingProperty.PROPERTY_ID}</h2>

              <div>
                <label>Unit Label: </label>
                <input
                  value={editingProperty.UNIT_LABEL}
                  onChange={(e) =>
                    setEditingProperty((prev) => ({
                      ...prev,
                      UNIT_LABEL: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label>Rent: </label>
                <input
                  type="number"
                  value={editingProperty.RENT_COST}
                  onChange={(e) =>
                    setEditingProperty((prev) => ({
                      ...prev,
                      RENT_COST: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label>Bedrooms: </label>
                <input
                  type="number"
                  step="0.5"
                  value={editingProperty.BEDROOMS}
                  onChange={(e) =>
                    setEditingProperty((prev) => ({
                      ...prev,
                      BEDROOMS: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label>Bathrooms: </label>
                <input
                  type="number"
                  step="0.5"
                  value={editingProperty.BATHROOMS}
                  onChange={(e) =>
                    setEditingProperty((prev) => ({
                      ...prev,
                      BATHROOMS: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label>Square Feet: </label>
                <input
                  type="number"
                  value={editingProperty.SQFT}
                  onChange={(e) =>
                    setEditingProperty((prev) => ({
                      ...prev,
                      SQFT: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={editingProperty.CAN_RENT}
                    onChange={(e) =>
                      setEditingProperty((prev) => ({
                        ...prev,
                        CAN_RENT: e.target.checked,
                      }))
                    }
                  />{" "}
                  Available to rent
                </label>
              </div>

              <div style={{ marginTop: "10px" }}>
                <button onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>{" "}
                <button onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
