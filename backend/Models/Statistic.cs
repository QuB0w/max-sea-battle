using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class Statistic
{
    [Key, ForeignKey(nameof(User))]
    public string UserId { get; set; } = string.Empty;

    public int Wins { get; set; }
    public int Losses { get; set; }
    public int GamesPlayed { get; set; }
    public int Experience { get; set; }
    public int Level { get; set; } = 1;

    [JsonIgnore]
    public User? User { get; set; }
}
